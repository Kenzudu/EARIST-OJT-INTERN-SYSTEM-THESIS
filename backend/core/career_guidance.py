"""
Career Guidance Recommendation System
Provides skill recommendations, certifications, and career path suggestions
Analyzes feedback from employers using NLP
"""

import google.generativeai as genai
from django.conf import settings
from core.models import StudentProfile, Application, Internship, PerformanceEvaluation, Task
from collections import Counter
import re

# Configure Google Generative AI
try:
    genai.configure(api_key=settings.GOOGLE_API_KEY)
    # Use standard 1.5 Flash model which is widely available and fast
    model = genai.GenerativeModel('gemini-1.5-flash')
except Exception as e:
    print(f"Warning: Google Generative AI not available: {e}")
    model = None



# Skill-to-resources mapping (fallback)
SKILL_RESOURCES = {
    'python': [
        'Codecademy: Python for Beginners',
        'Udemy: Complete Python Bootcamp',
        'Real Python: Python Tutorials'
    ],
    'javascript': [
        'Codecademy: Learn JavaScript',
        'Udemy: The Complete JavaScript Course',
        'freeCodeCamp: JavaScript Tutorial'
    ],
    'reactjs': [
        'Udemy: React - The Complete Guide',
        'Scrimba: Learn React for free',
        'React Official Docs: Learn React'
    ],
    'django': [
        'Django Official Documentation',
        'Real Python: Django for Beginners',
        'Udemy: Django for Beginners'
    ],
    'sql': [
        'Mode Analytics: SQL Tutorial',
        'Codecademy: Learn SQL',
        'DataCamp: SQL Basics'
    ],
    'docker': [
        'Docker Official Docs',
        'Udemy: Docker Mastery',
        'Play with Docker: Interactive Labs'
    ],
    'aws': [
        'AWS Free Tier + Tutorials',
        'Udemy: AWS Certified Solutions Architect',
        'Linux Academy: AWS Courses'
    ],
    'nodejs': [
        'Node.js Official Docs',
        'Udemy: The Complete Node.js Developer Course',
        'Codecademy: Learn Node.js'
    ],
    'mongodb': [
        'MongoDB University: Free Courses',
        'Udemy: The Complete Developers Guide to MongoDB',
        'MongoDB Official Docs'
    ],
    'git': [
        'GitHub Learning Lab',
        'Codecademy: Learn Git',
        'Atlassian: Git Tutorials'
    ],
}

# Career paths recommendations
CAREER_PATHS = [
    'Full Stack Developer - Building complete web applications',
    'Backend Engineer - Server-side development and APIs',
    'Frontend Developer - User interface and experience design',
    'DevOps Engineer - Infrastructure and deployment',
    'Cloud Solutions Architect - Cloud infrastructure design',
    'Data Engineer - Data processing and analytics',
    'Software Architect - System design and planning'
]

# Course-keyword specific guidance used as AI-style fallback suggestions
COURSE_KEYWORD_PATHS = {
    'computer science': [
        'Software Engineer - Build production systems with BSCS fundamentals',
        'AI/ML Engineer - Apply algorithms to real-world datasets',
        'Systems Analyst - Translate requirements into technical specs',
        'Tech Product Manager - Blend coding literacy with strategy'
    ],
    'information technology': [
        'Cloud Support Engineer - Maintain AWS/Azure infrastructure',
        'Cybersecurity Analyst - Protect networks and data assets',
        'IT Project Manager - Coordinate cross-functional delivery teams',
        'QA Automation Engineer - Safeguard releases with test suites'
    ],
    'computer engineering': [
        'Embedded Systems Engineer - Build firmware + hardware integrations',
        'IoT Solutions Architect - Connect sensors to cloud platforms',
        'Hardware Design Engineer - Prototype and test PCB layouts'
    ],
    'industrial technology': [
        'Manufacturing Engineer - Optimize plant-floor processes',
        'Process Technologist - Standardize SOPs for quality output',
        'Quality Assurance Specialist - Enforce safety and compliance'
    ],
    'architecture': [
        'Junior Architect - Assist in drafting and 3D modeling',
        'BIM Modeler - Create digital representations of physical places',
        'Interior Designer - Plan functional and aesthetic indoor spaces',
        'Urban Planner - Design land use and community environments',
        'Construction Project Manager - Oversee building site operations'
    ],
    'business administration': [
        'Marketing Strategist - Launch data-driven brand campaigns',
        'Business Development Manager - Grow partnerships and revenue',
        'HR Analyst - Use workforce analytics for talent planning'
    ],
    'entrepreneurship': [
        'Startup Founder - Launch solutions for niche problems',
        'Operations Lead - Build repeatable business processes',
        'Innovation Consultant - Coach SMEs on product-market fit'
    ],
    'education': [
        'Curriculum Designer - Build modern learning experiences',
        'EdTech Specialist - Implement digital classroom tools',
        'Academic Program Coordinator - Support student success initiatives'
    ],
    'engineering': [
        'Project Engineer - Coordinate multidisciplinary build projects',
        'R&D Engineer - Prototype new industrial solutions',
        'Sustainability Engineer - Optimize energy and materials usage'
    ],
    'hospitality': [
        'Hospitality Manager - Lead guest experience operations',
        'Events Director - Produce large-scale branded activations',
        'Tourism Development Officer - Curate regional travel programs'
    ],
    'criminology': [
        'Forensic Analyst - Turn evidence into investigative insight',
        'Security Consultant - Design risk mitigation playbooks',
        'Compliance Officer - Ensure policy adherence across orgs'
    ],
    'public administration': [
        'Policy Analyst - Evaluate impact of civic initiatives',
        'Program Manager - Deliver community development projects',
        'Public Affairs Officer - Communicate institutional priorities'
    ],
    'fine arts': [
        'Graphic Designer - Create visual concepts for brands',
        'Art Director - Lead creative vision for projects',
        'Multimedia Artist - Combine art and technology',
        'Illustrator - Create original artwork for publications'
    ],
    'psychology': [
        'HR Specialist - Manage employee relations and recruitment',
        'Guidance Counselor - Support student mental health',
        'Psychometrician - Administer and score psychological tests',
        'User Researcher - Analyze user behavior for product design'
    ],
    'science': [
        'Research Analyst - Conduct scientific data analysis',
        'Lab Technician - Manage laboratory operations',
        'Data Scientist - Interpret complex scientific data',
        'Quality Control Officer - Ensure product standards'
    ]
}

COURSE_KEYWORD_ALIASES = {
    'computer science': ['computer science', 'bscs', 'bs computer science'],
    'information technology': ['information technology', 'bsit', 'info. tech', ' i.t. ', 'information tech'],
    'computer engineering': ['computer engineering', 'bscoe'],
    'industrial technology': ['industrial technology', 'bsit -', 'industrial'],
    'architecture': ['architecture', 'bs arch', 'architectural', 'bsarch'],
    'business administration': ['business administration', 'bsba', 'marketing', 'hrdm'],
    'entrepreneurship': ['entrepreneurship', 'bsem'],
    'education': ['education', 'bse', 'teacher'],
    'engineering': ['engineering', 'civil', 'mechanical', 'electrical', 'electronics', 'chemical'],
    'hospitality': ['hospitality', 'tourism', 'bst', 'bshm'],
    'criminology': ['criminology', 'bscrim'],
    'public administration': ['public administration', 'bpa'],
    'fine arts': ['fine arts', 'bfa', 'painting', 'advertising', 'visual comm'],
    'psychology': ['psychology', 'bs psych', 'behavioral'],
    'science': ['physics', 'mathematics', 'math', 'biology', 'chemistry', 'applied science']
}

# Course-specific certifications
COURSE_CERTIFICATIONS = {
    'information technology': [
        'AWS Certified Cloud Practitioner',
        'Google Cloud Associate Cloud Engineer',
        'CompTIA Security+', 
        'Cisco Certified Network Associate (CCNA)',
        'Microsoft Azure Fundamentals'
    ],
    'computer science': [
        'AWS Certified Developer',
        'Oracle Certified Professional: Java',
        'Certified Kubernetes Application Developer (CKAD)',
        'TensorFlow Developer Certificate'
    ],
    'architecture': [
        'LEED Green Associate',
        'Autodesk Certified Professional: Revit',
        'Autodesk Certified Professional: AutoCAD',
        'Certified Construction Manager (CCM)',
        'NCARB Certificate'
    ],
    'engineering': [
        'Fundamentals of Engineering (FE)',
        'Six Sigma Green Belt',
        'Project Management Professional (PMP)',
        'Autodesk Certified Professional: Civil 3D',
        'Safety Officer Certification (BOSH/COSH)'
    ],
    'business administration': [
        'Certified Associate in Project Management (CAPM)',
        'Six Sigma Yellow Belt',
        'Certified Digital Marketing Professional',
        'Certified Human Resource Professional (CHRP)'
    ],
    'accountancy': [
        'Certified Public Accountant (CPA)',
        'Certified Management Accountant (CMA)',
        'Certified Internal Auditor (CIA)',
        'Xero Advisor Certification'
    ],
    'criminology': [
        'Certified Security Professional (CSP)',
        'Certified Forensic Computer Examiner',
        'Private Investigator License',
        'Civil Service Professional'
    ],
    'education': [
        'Licensure Examination for Teachers (LET)',
        'Google Certified Educator',
        'TESOL/TEFL Certification',
        'Educational Leadership Certificate'
    ],
    'hospitality': [
        'Certified Hospitality Supervisor (CHS)',
        'ServSafe Food Protection Manager',
        'Certified Guest Service Professional (CGSP)',
        'Events Industry Council (CMP)'
    ],
    'default': [
        'Project Management Professional (PMP)',
        'Civil Service Professional',
        'Six Sigma Yellow Belt',
        'Microsoft Office Specialist (MOS)',
        'Safety Officer (BOSH)'
    ]
}


class CareerGuidanceEngine:
    """
    Provides personalized career guidance and recommendations
    """

    def __init__(self, student_id):
        self.student_id = student_id
        self.student_profile = StudentProfile.objects.get(user_id=student_id)

    def get_skill_gaps(self):
        """
        Identify skills the student lacks but are frequently required in target internships
        """
        if not self.student_profile:
            return []

        # Get student's current skills
        student_skills = set(
            skill.strip().lower() 
            for skill in (self.student_profile.skills or "").split(",")
            if skill.strip()
        )

        # Get all applied internships' required skills
        applications = Application.objects.filter(student_id=self.student_id)
        required_skills_list = []

        for app in applications:
            if app.internship.required_skills:
                skills = [
                    s.strip().lower() 
                    for s in app.internship.required_skills.split(",")
                ]
                required_skills_list.extend(skills)

        # Find most common required skills
        if required_skills_list:
            skill_freq = Counter(required_skills_list)
            top_skills = skill_freq.most_common(10)

            # Get skills student doesn't have
            gaps = [
                {
                    'skill': skill,
                    'frequency': freq,
                    'recommendations': self.get_skill_resources(skill)
                }
                for skill, freq in top_skills
                if skill not in student_skills
            ]
            return gaps

        return []

    def get_skill_resources(self, skill):
        """
        Get recommendations for learning a specific skill
        """
        skill_lower = skill.lower().strip()
        
        # First try to find exact or partial match in fallback resources
        for key in SKILL_RESOURCES:
            if key in skill_lower or skill_lower in key:
                return SKILL_RESOURCES[key]
        
        # If model is available, try AI
        if model:
            try:
                prompt = f"""
                Provide 3 concise, actionable recommendations for learning "{skill}".
                Include online platforms (Coursera, Udemy, LinkedIn Learning, etc) where available.
                Format as a simple list with platform and course name.
                Keep it brief - max 2-3 lines total.
                """
                response = model.generate_content(prompt)
                resources = [
                    line.strip() 
                    for line in response.text.split('\\n') 
                    if line.strip()
                ]
                return resources[:3]
            except Exception as e:
                print(f"Error getting AI resources for {skill}: {str(e)}")
        
        # Fallback generic resources
        return [
            f'Udemy: {skill} Courses',
            f'Coursera: {skill} for Professionals',
            f'LinkedIn Learning: {skill} Training'
        ]

    def get_certification_recommendations(self):
        """
        Recommend certifications based on student's course/major
        """
        if not self.student_profile:
            return []

        course_lower = (self.student_profile.course or "").lower()
        interests_lower = (self.student_profile.career_interests or "").lower()

        # Find matching course category using aliases
        matched_category = 'default'
        
        # Check against aliases
        for canonical, aliases in COURSE_KEYWORD_ALIASES.items():
            if any(alias in course_lower for alias in aliases):
                # Check if we have specific certs for this category
                if canonical in COURSE_CERTIFICATIONS:
                    matched_category = canonical
                    break
        
        # If default, double check IT keywords
        if matched_category == 'default':
            if any(x in course_lower for x in ['computer', 'software', 'network', 'web']):
                matched_category = 'information technology'
            elif 'account' in course_lower:
                matched_category = 'accountancy'

        return COURSE_CERTIFICATIONS.get(matched_category, COURSE_CERTIFICATIONS['default'])

    def get_career_paths(self):
        """
        Suggest potential career paths based on course, career interests, and skills
        """
        if not self.student_profile:
            return []

        # Get student's course and career interests
        course = self.student_profile.course or ""
        career_interests = self.student_profile.career_interests or ""
        skills = self.student_profile.skills or ""
        
        # If no course or interests specified, return default paths
        if not course and not career_interests:
            return CAREER_PATHS
        
        # Try to use AI to generate personalized career paths
        print(f"[CareerGuidance] Model available: {model is not None}")
        if model:
            try:
                prompt = f"""
                Act as an expert Career Counselor.
                Analyze the profile of this student and recommend 5-7 distinct, concrete CAREER PATHS.
                
                HERE ARE EXAMPLES OF HOW TO REASON (FEW-SHOT TRAINING):

                Example 1:
                Input: Course: Bachelor of Science in Architecture, Career Interests: Design, Urban Planning, Skills: AutoCAD, Revit
                Output:
                Junior Architect - Entry-level design and drafting role.
                BIM Modeler - Focuses on digital building representations.
                Urban Planner - Designing community layouts and land use.
                Interior Designer - Planning functional indoor spaces.
                Construction Project Manager - Overseeing building site operations.

                Example 2:
                Input: Course: Bachelor of Science in Psychology, Career Interests: HR, Counseling, Skills: Empathy, Communication
                Output:
                HR Specialist - Managing employee relations and recruitment.
                Guidance Counselor - Supporting student mental health and academic goals.
                Psychometrician - Administering and scoring psychological tests.
                User Researcher - Analyzing user behavior for product design.
                Organizational Development Consultant - Improving workplace efficiency and culture.

                Example 3:
                Input: Course: Bachelor of Science in Information Technology, Career Interests: Web Development, Skills: React, Django
                Output:
                Full Stack Developer - Building complete web applications.
                Frontend Developer - Focusing on user interface and experience.
                Backend Engineer - Managing server-side logic and databases.
                DevOps Engineer - Handling deployment and infrastructure.
                QA Automation Engineer - Testing software for bugs and issues.

                NOW, ANALYZE THIS STUDENT:
                
                STUDENT PROFILE:
                • Course/Major: {course if course else 'Unknown'}
                • Career Interests: {career_interests if career_interests else 'Undecided'}
                • Skills: {skills if skills else 'None listed'}
                
                CRITICAL INSTRUCTIONS:
                1. RECOMMENDATIONS MUST BE DIRECTLY RELEVANT to the student's Course/Major.
                   (e.g., specific Engineering roles for Engineers, specific Design roles for Creatives).
                2. Do not suggest generic IT roles unless the course is IT/CS related.
                3. Provide a brief 5-10 word justification for each role based on their skills/interests.
                4. Output plain text, one role per line in this format:
                   "Role Title - Justification"
                
                No markdown, no numbering, just the lines.
                """
                
                print(f"[CareerGuidance] Generating AI paths for course='{course}', interests='{career_interests}', skills='{skills}'")
                response = model.generate_content(prompt)
                print(f"[CareerGuidance] AI Response: {response.text[:200]}...")
                
                ai_paths = [
                    line.strip()
                    for line in response.text.split('\n')
                    if line.strip() and not line.strip().startswith('#') and '-' in line
                ]
                
                print(f"[CareerGuidance] Parsed {len(ai_paths)} AI career paths")
                
                # If AI returned valid paths, use them
                if ai_paths and len(ai_paths) >= 3:
                    print(f"[CareerGuidance] Using AI-generated paths: {ai_paths[:3]}")
                    return ai_paths[:7]  # Return up to 7 paths
                else:
                    print(f"[CareerGuidance] AI returned insufficient paths ({len(ai_paths)}), using fallback")
                    
            except Exception as e:
                print(f"[CareerGuidance] Error generating AI career paths: {str(e)}")
                import traceback
                traceback.print_exc()
                # Fall through to filtered fallback
        
        # Fallback: Filter default career paths based on course and interests
        filtered_paths = []
        course_lower = course.lower() if course else ""
        interests_lower = career_interests.lower() if career_interests else ""
        
        # Course-based filtering
        course_keywords = {
            'computer': ['developer', 'engineer', 'software', 'programming', 'tech', 'it'],
            'information': ['developer', 'engineer', 'software', 'data', 'tech', 'it', 'systems'],
            'engineering': ['engineer', 'development', 'systems', 'architecture'],
            'business': ['analyst', 'manager', 'consultant', 'marketing', 'sales'],
            'accounting': ['accountant', 'auditor', 'financial', 'analyst'],
            'marketing': ['marketing', 'brand', 'digital', 'social media', 'advertising'],
            'management': ['manager', 'consultant', 'analyst', 'coordinator'],
        }
        
        # Interest-based filtering
        interest_keywords = {
            'web': ['frontend', 'backend', 'full stack', 'developer'],
            'mobile': ['mobile', 'app', 'ios', 'android'],
            'data': ['data', 'analyst', 'scientist', 'engineer'],
            'cloud': ['cloud', 'devops', 'aws', 'azure'],
            'security': ['security', 'cybersecurity', 'information security'],
            'design': ['designer', 'ui', 'ux', 'frontend'],
        }
        
        # Determine relevant keywords
        relevant_keywords = []
        for key, keywords in course_keywords.items():
            if key in course_lower:
                relevant_keywords.extend(keywords)
        
        for key, keywords in interest_keywords.items():
            if key in interests_lower:
                relevant_keywords.extend(keywords)
        
        # Filter career paths based on keywords
        if relevant_keywords:
            for path in CAREER_PATHS:
                path_lower = path.lower()
                if any(keyword in path_lower for keyword in relevant_keywords):
                    filtered_paths.append(path)
        
        # Add curated course-specific paths as a smart fallback
        course_specific_paths = self._course_based_paths(course_lower, interests_lower)
        if course_specific_paths:
            filtered_paths = course_specific_paths + [p for p in filtered_paths if p not in course_specific_paths]
        
        # If we have filtered paths, return them; otherwise return all
        return filtered_paths if filtered_paths else course_specific_paths or CAREER_PATHS

    def _course_based_paths(self, course_lower, interests_lower):
        """
        Return curated course-specific career suggestions (AI-style fallback).
        """
        if not course_lower and not interests_lower:
            return []
        
        matched_paths = []
        for canonical_keyword, aliases in COURSE_KEYWORD_ALIASES.items():
            alias_hit = any(alias in course_lower for alias in aliases) or any(alias in interests_lower for alias in aliases)
            if alias_hit:
                matched_paths.extend(COURSE_KEYWORD_PATHS.get(canonical_keyword, []))
        
        seen = set()
        unique = []
        for path in matched_paths:
            if path not in seen:
                seen.add(path)
                unique.append(path)
        return unique[:7]

    def analyze_strengths_weaknesses(self):
        """
        Analyze student's profile to identify strengths and areas for improvement
        """
        if not self.student_profile:
            return {}

        # Extract data from profile
        skills = (self.student_profile.skills or "").split(',') if self.student_profile.skills else []
        interests = self.student_profile.career_interests or ""
        has_certifications = bool(self.student_profile.certifications)
        
        # Build fallback analysis
        strengths = []
        improvements = []
        
        if skills:
            strengths.append(f"Has documented technical skills ({len(skills)} skills)")
        if interests:
            strengths.append(f"Clear career interests in {interests}")
        if has_certifications:
            strengths.append(f"Pursuing certifications: {self.student_profile.certifications}")
        if not strengths:
            strengths.append("Has started building a professional profile")
        
        if len(skills) < 3:
            improvements.append("Develop more technical skills - aim for 5+ primary skills")
        if not interests:
            improvements.append("Define clear career interests and goals")
        improvements.append("Continue gaining practical internship experience")
        
        next_steps = [
            "Apply to 2-3 internships in your area of interest",
            "Complete at least one online course to strengthen skills",
            "Network with professionals in your target industry"
        ]
        
        return {
            'analysis': f"Strengths: {', '.join(strengths)}. Improvements: {', '.join(improvements)}.",
            'summary': {
                'strengths': strengths[:3],
                'improvements': improvements[:3],
                'next_steps': next_steps
            }
        }


class FeedbackAnalysisEngine:
    """
    Analyzes employer feedback to identify trends and provide insights
    """

    def __init__(self, student_id):
        self.student_id = student_id

    def analyze_feedback(self):
        """
        Analyze all feedback from applications, evaluations, and tasks
        """
        feedback_list = []

        # 1. Get feedback from Applications
        applications = Application.objects.filter(
            student_id=self.student_id,
            feedback__isnull=False
        ).exclude(feedback='')
        for app in applications:
            feedback_list.append(app.feedback)

        # 2. Get feedback from Performance Evaluations
        evaluations = PerformanceEvaluation.objects.filter(
            student_id=self.student_id
        )
        for eval in evaluations:
            if eval.comments:
                feedback_list.append(eval.comments)
            if eval.strengths:
                feedback_list.append(f"Strengths: {eval.strengths}")
            if eval.areas_for_improvement:
                feedback_list.append(f"Areas for Improvement: {eval.areas_for_improvement}")

        # 3. Get feedback from Tasks
        tasks = Task.objects.filter(
            student_id=self.student_id,
            supervisor_feedback__isnull=False
        ).exclude(supervisor_feedback='')
        for task in tasks:
            feedback_list.append(task.supervisor_feedback)

        if not feedback_list:
            return {'message': 'No feedback available yet'}

        return self._extract_insights(feedback_list)

    def _extract_insights(self, feedback_list):
        """
        Extract patterns and insights from feedback using AI
        """
        if not feedback_list:
            return {'message': 'No feedback available yet'}

        feedback_text = "\n- ".join(feedback_list)
        
        # Try AI Generation first
        if model:
            try:
                prompt = f"""
                Act as a Career Coach for a student intern.
                Analyze the following feedback received from their supervisors:

                FEEDBACK:
                - {feedback_text}

                TASK:
                Write a personalized, encouraging, and constructive summary (max 150 words).
                1. Highlight their key strengths found in the feedback.
                2. Gently point out specific areas for improvement mentioned.
                3. Give 1 concrete actionable tip for their next step.
                4. Tone: Professional, motivating, like a mentor speaking directly to the student ("You have shown...").
                5. Do NOT use headers like "Strengths:" or "Weaknesses:". Write it as a cohesive paragraph.
                """
                
                print(f"[FeedbackAnalysis] Sending {len(feedback_list)} entries to AI...")
                response = model.generate_content(prompt)
                ai_analysis = response.text.strip()
                
                return {
                    'total_feedback_entries': len(feedback_list),
                    'analysis': ai_analysis,
                    'is_ai_generated': True
                }
            except Exception as e:
                print(f"[FeedbackAnalysis] AI Error: {e}")
                # Fall through to fallback

        # Fallback: Keyword Matching (Original Logic)
        feedback_lower = feedback_text.lower()
        
        # Define positive and negative keywords
        positive_words = [
            'excellent', 'great', 'good', 'strong', 'impressive', 'reliable',
            'professional', 'quick', 'thorough', 'collaborative', 'creative',
            'outstanding', 'talented', 'diligent', 'eager', 'helpful'
        ]
        negative_words = [
            'slow', 'late', 'incomplete', 'mistake', 'error', 'missed',
            'unclear', 'rushed', 'needs improvement', 'lacking', 'inconsistent',
            'unfocused', 'unprepared', 'disorganized'
        ]
        
        # Extract keywords
        positive_found = [word for word in positive_words if word in feedback_lower]
        negative_found = [word for word in negative_words if word in feedback_lower]
        
        strengths = positive_found[:3] if positive_found else ["Reliability", "Effort", "Participation"]
        improvements = negative_found[:3] if negative_found else ["Specific technical skills", "Communication nuances"]
        
        return {
            'total_feedback_entries': len(feedback_list),
            'analysis': f"Based on {len(feedback_list)} feedback entries, you have shown strengths in {', '.join(strengths)}. Consider focusing on {', '.join(improvements)} to further improve your performance.",
            'is_ai_generated': False
        }

    def _extract_keywords(self, feedback_list, sentiment_type):
        """
        Extract positive or negative keywords from feedback
        """
        positive_words = [
            'excellent', 'great', 'good', 'strong', 'impressive', 'reliable',
            'professional', 'quick', 'thorough', 'collaborative', 'creative'
        ]
        negative_words = [
            'slow', 'late', 'incomplete', 'mistake', 'error', 'missed',
            'unclear', 'rushed', 'needs improvement', 'lacking'
        ]

        keywords_to_check = positive_words if sentiment_type == 'positive' else negative_words
        found_keywords = []

        for feedback in feedback_list:
            feedback_lower = feedback.lower()
            for keyword in keywords_to_check:
                if keyword in feedback_lower:
                    found_keywords.append(keyword)

        keyword_freq = Counter(found_keywords)
        return dict(keyword_freq.most_common(5))


def get_career_guidance(student_id, model='models/gemini-2.5-flash'):
    """
    Get comprehensive career guidance for a student
    """
    try:
        # Re-configure model if specified
        if model and model != 'models/gemini-2.5-flash':
            try:
                genai.configure(api_key=settings.GOOGLE_API_KEY)
                genai.GenerativeModel(model)
            except:
                pass  # Fall back to default
        
        engine = CareerGuidanceEngine(student_id)

        return {
            'skill_gaps': engine.get_skill_gaps(),
            'certifications': engine.get_certification_recommendations(),
            'career_paths': engine.get_career_paths(),
            'analysis': engine.analyze_strengths_weaknesses(),
            'model': model
        }
    except Exception as e:
        print(f"Error getting career guidance: {str(e)}")
        return {'error': str(e)}


def analyze_feedback(student_id, model='models/gemini-2.5-flash'):
    """
    Analyze employer feedback for a student
    """
    try:
        # Re-configure model if specified
        if model and model != 'models/gemini-2.5-flash':
            try:
                genai.configure(api_key=settings.GOOGLE_API_KEY)
                genai.GenerativeModel(model)
            except:
                pass  # Fall back to default
        
        engine = FeedbackAnalysisEngine(student_id)
        result = engine.analyze_feedback()
        result['model'] = model
        return result
    except Exception as e:
        print(f"Error analyzing feedback: {str(e)}")
        return {'error': str(e)}
