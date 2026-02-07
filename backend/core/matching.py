"""
Student-Internship Matching Engine
Uses collaborative filtering, NLP, and ranking algorithm
Integrated with Google Generative AI for enhanced analysis
"""

import json
from django.core.cache import cache
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q, F, Count
from core.models import Application, Internship, Company, StudentProfile
from django.contrib.auth.models import User
from core.serializers import InternshipSerializer
import google.generativeai as genai
from django.conf import settings

# Configure Google Generative AI
try:
    genai.configure(api_key=settings.GOOGLE_API_KEY)
    model = genai.GenerativeModel('gemini-2.0-flash')
except Exception as e:
    print(f"Warning: Google Generative AI not available: {e}")
    model = None


class StudentInternshipMatcher:
    """
    Matches students to internships using multiple algorithms
    """

    def __init__(self, student_id, top_n=10, model_name='gemini-2.0-flash'):
        self.student_id = student_id
        self.top_n = top_n
        self.student = User.objects.get(id=student_id)
        self.student_profile = StudentProfile.objects.filter(user=self.student).first()
        # selected model name and model instance (if available)
        self.model_name = model_name or 'gemini-2.0-flash'
        try:
            self.model = genai.GenerativeModel(self.model_name)
        except Exception:
            # fall back to default global model if available
            try:
                self.model = genai.GenerativeModel('gemini-2.0-flash')
                self.model_name = 'gemini-2.0-flash'
            except Exception:
                self.model = None

    def get_collaborative_filtering_matches(self):
        """
        Uses collaborative filtering: if students with similar profiles applied
        to internships, recommend those internships to the student.
        """
        prof_stamp = getattr(self.student_profile, 'updated_at', None)
        prof_tag = prof_stamp.isoformat() if prof_stamp else 'noprof'
        cache_key = f"collab_match_{self.student_id}_{prof_tag}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        # Get student's applications
        my_apps = Application.objects.filter(student=self.student).values_list('internship_id', flat=True)

        # Find students with similar internship interests
        similar_students = Application.objects.filter(
            internship_id__in=my_apps
        ).values_list('student_id', flat=True).distinct()

        # Get internships applied by similar students but not by our student
        recommended_internships = Application.objects.filter(
            student_id__in=similar_students
        ).exclude(
            internship_id__in=my_apps
        ).values('internship_id').annotate(
            count=Count('id')
        ).order_by('-count')[:self.top_n]

        internship_ids = [item['internship_id'] for item in recommended_internships]
        cache.set(cache_key, internship_ids, 600)  # Cache for 10 minutes
        return internship_ids

    def _filter_internships_by_course(self, internships, course, career_interests):
        """
        Filter internships based on course and career interests relevance
        """
        if not course:
            return list(internships)
        
        course_lower = course.lower()
        interests_lower = (career_interests or "").lower()
        
        # First, hard-filter by explicit required_courses field if provided
        # If an internship specifies required_courses, only keep it when it matches
        # the student's course text (case-insensitive, partial match allowed).
        base_filtered = []
        student_college = getattr(self.student_profile, 'college', None)

        for internship in internships:
            # 1. Strict Filter by Company Target Colleges
            # If the company specifies target colleges, strictly enforce them.
            target_colleges = getattr(internship.company, 'target_colleges', [])
            
            if target_colleges and isinstance(target_colleges, list) and len(target_colleges) > 0:
                # If student has a college, check if it's in the target list
                if student_college:
                    if student_college not in target_colleges:
                        continue  # Skip: Student's college is not in the target list
                else:
                    # If student has no college profile set, hide restricted internships to be safe
                    continue

            # 2. Hard-filter by explicit required_courses field if provided
            required_courses = (getattr(internship, "required_courses", "") or "").strip()
            if required_courses:
                tokens = [
                    c.strip().lower()
                    for c in required_courses.split(",")
                    if c.strip()
                ]
                if tokens and not any(
                    token in course_lower or course_lower in token
                    for token in tokens
                ):
                    # Student course does not match any required course for this internship
                    continue
            base_filtered.append(internship)

        # If nothing passed the hard filter, return early
        if not base_filtered:
            return []

        # Course to internship keywords mapping
        course_keywords = {
            'computer': ['software', 'developer', 'programming', 'web', 'app', 'system', 'tech', 'it', 'data', 'cloud'],
            'information': ['software', 'developer', 'system', 'tech', 'it', 'data', 'network', 'database', 'cloud'],
            'engineering': ['engineer', 'development', 'system', 'technical', 'design', 'architecture'],
            'business': ['business', 'analyst', 'marketing', 'sales', 'management', 'finance', 'accounting'],
            'accounting': ['accounting', 'finance', 'audit', 'financial', 'bookkeeping', 'tax'],
            'marketing': ['marketing', 'advertising', 'brand', 'digital', 'social media', 'content', 'promotion'],
            'management': ['management', 'business', 'operations', 'project', 'administrative'],
        }
        
        # Interest-based keywords
        interest_keywords = {
            'web': ['web', 'frontend', 'backend', 'full stack', 'developer'],
            'mobile': ['mobile', 'app', 'ios', 'android', 'react native'],
            'data': ['data', 'analyst', 'scientist', 'analytics', 'database'],
            'cloud': ['cloud', 'aws', 'azure', 'devops', 'infrastructure'],
            'security': ['security', 'cybersecurity', 'information security', 'network security'],
            'design': ['design', 'ui', 'ux', 'frontend', 'graphic'],
        }
        
        # Get relevant keywords for this course
        relevant_keywords = []
        for key, keywords in course_keywords.items():
            if key in course_lower:
                relevant_keywords.extend(keywords)
        
        # Add interest-based keywords
        for key, keywords in interest_keywords.items():
            if key in interests_lower:
                relevant_keywords.extend(keywords)
        
        # If we have no additional keyword hints, just return internships that
        # passed the explicit required_courses filter.
        if not relevant_keywords:
            return list(base_filtered)
        
        # Filter internships
        filtered = []
        for internship in base_filtered:
            position_lower = (internship.position or "").lower()
            skills_lower = (internship.required_skills or "").lower()
            description_lower = (internship.description or "").lower()
            
            # Check if internship matches any relevant keyword
            text_to_check = f"{position_lower} {skills_lower} {description_lower}"
            if any(keyword in text_to_check for keyword in relevant_keywords):
                filtered.append(internship)
        
        return filtered[:50]  # Limit to 50 for AI processing

    def get_skill_based_matches(self):
        """
        Uses NLP to match student skills with internship requirements
        """
        if not self.student_profile:
            return []

        prof_stamp = getattr(self.student_profile, 'updated_at', None)
        prof_tag = prof_stamp.isoformat() if prof_stamp else 'noprof'
        cache_key = f"skill_match_{self.student_id}_{prof_tag}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        student_skills = set(
            skill.strip().lower() 
            for skill in (self.student_profile.skills or "").split(",")
            if skill.strip()
        )

        if not student_skills:
            return []

        # Get internships with matching required skills
        # Filter by course if specified
        all_internships = Internship.objects.all()
        
        # Pre-filter by course if course is specified
        if self.student_profile.course:
            internships = self._filter_internships_by_course(
                all_internships, 
                self.student_profile.course, 
                self.student_profile.career_interests or ""
            )
            # If course filtering removed all internships, use all (fallback)
            if not internships:
                internships = all_internships
        else:
            internships = all_internships

        scored_internships = []
        for internship in internships:
            required_skills = set(
                skill.strip().lower() 
                for skill in (internship.required_skills or "").split(",")
                if skill.strip()
            )

            if required_skills:
                # Calculate skill match score
                matches = len(student_skills & required_skills)
                score = (matches / len(required_skills)) * 100
                if score > 0:
                    scored_internships.append({
                        'internship_id': internship.id,
                        'score': score
                    })

        # Sort by score and get top N
        scored_internships.sort(key=lambda x: x['score'], reverse=True)
        internship_ids = [item['internship_id'] for item in scored_internships[:self.top_n]]

        cache.set(cache_key, internship_ids, 600)
        return internship_ids

    def get_ai_recommendations(self):
        """
        Uses Google Generative AI to analyze student profile and recommend internships
        """
        # use the instance model (self.model) and include profile timestamp + model name in cache key
        if not self.model or not self.student_profile:
            return []

        prof_stamp = getattr(self.student_profile, 'updated_at', None)
        prof_tag = prof_stamp.isoformat() if prof_stamp else 'noprof'
        cache_key = f"ai_match_{self.student_id}_{prof_tag}_{self.model_name}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        try:
            # Get student's course and career interests
            course = self.student_profile.course or ""
            career_interests = self.student_profile.career_interests or ""
            
            # Prepare student profile data with course information
            student_summary = f"""
            Student Profile: {self.student.get_full_name() or self.student.username}
            Course/Program: {course if course else 'Not specified'}
            Career Interests: {career_interests if career_interests else 'Not specified'}
            Skills: {self.student_profile.skills or 'Not specified'}
            Certifications: {self.student_profile.certifications or 'None'}
            Bio: {self.student_profile.bio or 'Not specified'}
            """

            # Get available internships - filter by course relevance if course is specified
            all_internships = Internship.objects.all()
            
            # Pre-filter internships based on course if specified
            if course:
                filtered_internships = self._filter_internships_by_course(all_internships, course, career_interests)
                # Use filtered list if we have matches, otherwise use all
                internships = filtered_internships if filtered_internships else all_internships[:50]
            else:
                internships = all_internships[:50]
            
            internship_list = "\n".join([
                f"- {i.position} at {i.company.name}: {i.required_skills}"
                for i in internships
            ])

            prompt = f"""
            Act as an expert Internship Coordinator.
            Your task is to match a student to the most relevant internships based on their COURSE and SKILLS.

            HERE ARE EXAMPLES OF CORRECT MATCHING LOGIC (FEW-SHOT):

            Example 1:
            Student Course: Bachelor of Science in Architecture
            Internships Available: [Software Intern, Site Engineer Intern, Junior Architect Intern, Sales Associate]
            Recommendation:
            Junior Architect Intern - Directly matches architecture course.
            Site Engineer Intern - Relevant to construction and design field.
            (Note: Strictly ignored Software Intern and Sales Associate).

            Example 2:
            Student Course: Bachelor of Science in Psychology
            Internships Available: [HR Intern, Guidance Assistant, Web Developer, Marketing Intern]
            Recommendation:
            HR Intern - Matches organizational psychology and recruitment.
            Guidance Assistant - Matches clinical interest.
            (Note: Strictly ignored Web Developer).

            Example 3:
            Student Course: Bachelor of Science in Computer Science
            Internships Available: [Civil Engineering Intern, React Developer, IT Support, Accountant]
            Recommendation:
            React Developer - Fits software development focus.
            IT Support - Relevant to general technology operations.
            (Note: Strictly ignored Civil Engineering and Accountant).

            NOW, ANALYZE THIS REAL CASE:

            Student Profile:
            {student_summary}

            Available Internships:
            {internship_list}

            Recommend the top 5 internships that:
            1. Are RELEVANT to the student's course/program: {course if course else 'Any'}
            2. Match their career interests: {career_interests if career_interests else 'Any'}
            3. Align with their skills and background
            
            IMPORTANT: 
            - PRIORITY #1 is the COURSE. Do not recommend valid skills if they are for the wrong career (e.g. don't suggest IT jobs to an Architect just because they know "Computers").
            - Only recommend internships that are suitable for a student studying {course if course else 'their field'}.
            
            Return only the internship position titles, one per line, with a brief reason why it's a good match.
            """

            response = self.model.generate_content(prompt)
            recommendations_text = getattr(response, 'text', None) or getattr(response, 'content', None) or str(response)

            # Parse recommendations to get internship titles
            internship_ids = []
            for line in recommendations_text.split('\n'):
                if line.strip():
                    for internship in internships:
                        if internship.position.lower() in line.lower():
                            internship_ids.append(internship.id)
                            break

            internship_ids = internship_ids[:self.top_n]
            cache.set(cache_key, internship_ids, 600)
            return internship_ids

        except Exception as e:
            print(f"AI recommendation error: {str(e)}")
            return []

    def get_final_rankings(self):
        """
        Combines all matching algorithms with weighted scoring
        Filters out internships not suitable for student's course
        """
        # Get matches from each algorithm
        collab_matches = set(self.get_collaborative_filtering_matches())
        skill_matches = set(self.get_skill_based_matches())
        ai_matches = set(self.get_ai_recommendations())

        # Filter out internships not suitable for course if course is specified
        if self.student_profile and self.student_profile.course:
            course = self.student_profile.course.lower()
            career_interests = (self.student_profile.career_interests or "").lower()
            
            # Get all recommended internship IDs
            all_recommended_ids = collab_matches | skill_matches | ai_matches
            all_internships = Internship.objects.filter(id__in=all_recommended_ids)
            filtered_internships = self._filter_internships_by_course(all_internships, course, career_interests)
            filtered_ids = {i.id for i in filtered_internships}
            
            # Only keep matches that passed course filtering
            collab_matches = collab_matches & filtered_ids
            skill_matches = skill_matches & filtered_ids
            ai_matches = ai_matches & filtered_ids

        # Score internships based on frequency in recommendations
        # Base score max is 100 (25 collab + 40 skills + 35 AI)
        internship_scores = {}
        for internship_id in collab_matches | skill_matches | ai_matches:
            score = 0
            if internship_id in collab_matches:
                score += 25
            if internship_id in skill_matches:
                score += 40  # Weight higher than collaborative
            if internship_id in ai_matches:
                score += 35  # Weight AI recommendations

            internship_scores[internship_id] = score

        # Sort by score and get internships (highest compatibility first)
        sorted_items = sorted(internship_scores.items(), key=lambda x: x[1], reverse=True)
        top_internship_ids = [item[0] for item in sorted_items[:self.top_n]]

        # Get internship objects
        internships_qs = Internship.objects.filter(id__in=top_internship_ids)
        internships_map = {i.id: i for i in internships_qs}
        ordered = [internships_map[iid] for iid in top_internship_ids if iid in internships_map]

        # Attach a normalized 0–100 compatibility_score to each internship instance
        # so the serializer can expose it to the frontend.
        for internship in ordered:
          raw_score = internship_scores.get(internship.id, 0)
          # Ensure float and clamp to 0–100
          normalized = float(max(0, min(raw_score, 100)))
          setattr(internship, "compatibility_score", normalized)

        return InternshipSerializer(ordered, many=True).data


def get_student_matches(student_id, top_n=10, model='gemini-2.0-flash'):
    """
    Main function to get recommended internships for a student
    """
    matcher = StudentInternshipMatcher(student_id, top_n, model_name=model)
    return matcher.get_final_rankings()
