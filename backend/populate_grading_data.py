"""
Populate dummy grading data for all students across all colleges
This script creates:
1. Grading criteria (if not exists)
2. Student final grades with realistic scores
"""

import os
import django
import random
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import GradingCriteria, StudentFinalGrade, UserRole, StudentProfile

def create_grading_criteria():
    """Create default grading criteria if they don't exist"""
    criteria = [
        {
            'name': 'Attendance',
            'weight': Decimal('30.00'),
            'description': 'Daily attendance and punctuality during internship'
        },
        {
            'name': 'Supervisor Evaluation',
            'weight': Decimal('50.00'),
            'description': 'Performance evaluation from company supervisor'
        },
        {
            'name': 'Requirements Submission',
            'weight': Decimal('20.00'),
            'description': 'Timely submission of journals, reports, and other requirements'
        }
    ]
    
    created_count = 0
    for criterion in criteria:
        obj, created = GradingCriteria.objects.get_or_create(
            name=criterion['name'],
            defaults={
                'weight': criterion['weight'],
                'description': criterion['description']
            }
        )
        if created:
            created_count += 1
            print(f"✅ Created grading criterion: {criterion['name']} ({criterion['weight']}%)")
    
    if created_count == 0:
        print("ℹ️  Grading criteria already exist")
    
    return GradingCriteria.objects.all()

def generate_realistic_grade():
    """Generate realistic grade components"""
    # Generate scores with realistic distribution
    # Most students should score between 75-95
    attendance = round(random.uniform(75, 100), 2)
    supervisor_rating = round(random.uniform(70, 98), 2)
    requirements = round(random.uniform(80, 100), 2)
    
    # Calculate weighted final grade (1.0 - 5.0 scale)
    # Formula: Convert 100-point scale to 5.0-1.0 scale
    weighted_score = (attendance * 0.30) + (supervisor_rating * 0.50) + (requirements * 0.20)
    
    # Convert to 1.0-5.0 scale (inverted: higher score = lower grade number)
    if weighted_score >= 97:
        final_grade = 1.0
    elif weighted_score >= 94:
        final_grade = 1.25
    elif weighted_score >= 91:
        final_grade = 1.5
    elif weighted_score >= 88:
        final_grade = 1.75
    elif weighted_score >= 85:
        final_grade = 2.0
    elif weighted_score >= 82:
        final_grade = 2.25
    elif weighted_score >= 79:
        final_grade = 2.5
    elif weighted_score >= 76:
        final_grade = 2.75
    elif weighted_score >= 75:
        final_grade = 3.0
    else:
        final_grade = 5.0  # Failed
    
    # Determine remarks
    if final_grade <= 3.0:
        remarks = 'Passed'
    else:
        remarks = 'Failed'
    
    return {
        'attendance_score': Decimal(str(attendance)),
        'supervisor_rating_score': Decimal(str(supervisor_rating)),
        'requirements_score': Decimal(str(requirements)),
        'final_grade': Decimal(str(final_grade)),
        'remarks': remarks
    }

def populate_student_grades():
    """Populate grades for all students"""
    # Get all students
    students = User.objects.filter(user_role__role='student')
    
    if not students.exists():
        print("❌ No students found in the database!")
        return
    
    print(f"\n📊 Found {students.count()} students")
    print("=" * 80)
    
    # Group students by college
    college_stats = {}
    created_count = 0
    updated_count = 0
    
    for student in students:
        try:
            # Get student's college
            college = "Unknown"
            if hasattr(student, 'student_profile') and student.student_profile:
                college = student.student_profile.college or "Unknown"
            
            # Generate or update grade
            grade_data = generate_realistic_grade()
            
            grade, created = StudentFinalGrade.objects.update_or_create(
                student=student,
                defaults=grade_data
            )
            
            if created:
                created_count += 1
            else:
                updated_count += 1
            
            # Track college statistics
            if college not in college_stats:
                college_stats[college] = {
                    'total': 0,
                    'passed': 0,
                    'failed': 0,
                    'avg_grade': []
                }
            
            college_stats[college]['total'] += 1
            if grade.remarks == 'Passed':
                college_stats[college]['passed'] += 1
            else:
                college_stats[college]['failed'] += 1
            college_stats[college]['avg_grade'].append(float(grade.final_grade))
            
            # Print student info
            student_name = f"{student.first_name} {student.last_name}" if student.first_name else student.username
            print(f"✅ {student_name:30} | {college:6} | Grade: {grade.final_grade} | {grade.remarks}")
            
        except Exception as e:
            print(f"❌ Error processing student {student.username}: {str(e)}")
    
    print("\n" + "=" * 80)
    print(f"📈 Summary: {created_count} created, {updated_count} updated")
    print("=" * 80)
    
    # Print college statistics
    print("\n📊 COLLEGE STATISTICS")
    print("=" * 80)
    print(f"{'College':<10} | {'Total':<6} | {'Passed':<6} | {'Failed':<6} | {'Pass Rate':<10} | {'Avg Grade'}")
    print("-" * 80)
    
    for college, stats in sorted(college_stats.items()):
        pass_rate = (stats['passed'] / stats['total'] * 100) if stats['total'] > 0 else 0
        avg_grade = sum(stats['avg_grade']) / len(stats['avg_grade']) if stats['avg_grade'] else 0
        
        print(f"{college:<10} | {stats['total']:<6} | {stats['passed']:<6} | {stats['failed']:<6} | {pass_rate:>6.1f}%    | {avg_grade:.2f}")
    
    print("=" * 80)

def main():
    print("🎓 STUDENT GRADING DATA POPULATION SCRIPT")
    print("=" * 80)
    
    # Step 1: Create grading criteria
    print("\n📋 Step 1: Creating Grading Criteria...")
    criteria = create_grading_criteria()
    
    # Step 2: Populate student grades
    print("\n📝 Step 2: Populating Student Grades...")
    populate_student_grades()
    
    print("\n✅ DONE! Grading data has been populated successfully!")
    print("\n💡 You can now view the gradebook in the Coordinator Portal")
    print("   Navigate to: Coordinator Dashboard → Grading → Gradebook tab")

if __name__ == '__main__':
    main()
