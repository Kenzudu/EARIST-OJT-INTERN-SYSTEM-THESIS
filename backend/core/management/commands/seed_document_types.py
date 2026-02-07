from django.core.management.base import BaseCommand
from core.models import DocumentTypeConfig

class Command(BaseCommand):
    help = 'Seed default document types for the system'

    def handle(self, *args, **kwargs):
        default_types = [
            {
                'name': 'Endorsement Letter',
                'code': 'endorsement_letter',
                'description': 'Official letter endorsing a student for internship at a specific company',
                'category': 'Letters',
                'requires_student': True,
                'requires_company': True,
                'is_enabled': True,
            },
            {
                'name': 'Acceptance Letter',
                'code': 'acceptance_letter',
                'description': 'Letter welcoming a company as a partner in the internship program',
                'category': 'Letters',
                'requires_student': False,
                'requires_company': True,
                'is_enabled': True,
            },
            {
                'name': 'Recommendation Letter',
                'code': 'recommendation_letter',
                'description': 'Recommendation letter for a student based on internship performance',
                'category': 'Letters',
                'requires_student': True,
                'requires_company': False,
                'is_enabled': True,
            },
            {
                'name': 'Completion Certificate',
                'code': 'completion_certificate',
                'description': 'Certificate of completion for student who finished internship',
                'category': 'Certificates',
                'requires_student': True,
                'requires_company': False,
                'is_enabled': True,
            },
            {
                'name': 'Waiver/Consent Form',
                'code': 'waiver_consent',
                'description': 'Waiver and consent form for student participation in internship program',
                'category': 'Legal Documents',
                'requires_student': True,
                'requires_company': False,
                'is_enabled': True,
            },
            {
                'name': 'Consent Letter',
                'code': 'consent_letter',
                'description': 'Consent letter for student participation and data privacy agreement',
                'category': 'Legal Documents',
                'requires_student': True,
                'requires_company': False,
                'is_enabled': True,
            },
            {
                'name': 'Contract/MOA',
                'code': 'contract_moa',
                'description': 'Memorandum of Agreement between institution and company',
                'category': 'Legal Documents',
                'requires_student': False,
                'requires_company': True,
                'is_enabled': True,
            },
            {
                'name': 'Progress Report',
                'code': 'progress_report',
                'description': 'Summary report of internship program statistics and metrics',
                'category': 'Reports',
                'requires_student': False,
                'requires_company': False,
                'is_enabled': True,
            },
            {
                'name': 'Evaluation Summary',
                'code': 'evaluation_summary',
                'description': 'Compiled evaluation data from company supervisors',
                'category': 'Reports',
                'requires_student': False,
                'requires_company': False,
                'is_enabled': True,
            },
            {
                'name': 'Training Plan',
                'code': 'training_plan',
                'description': 'Structured training plan outlining tasks, timeline, and expected outcomes for student',
                'category': 'Legal Documents',
                'requires_student': True,
                'requires_company': False,
                'is_enabled': True,
            },
        ]

        created_count = 0
        updated_count = 0

        for doc_type_data in default_types:
            doc_type, created = DocumentTypeConfig.objects.get_or_create(
                code=doc_type_data['code'],
                defaults=doc_type_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'✓ Created: {doc_type.name}'))
            else:
                # Update existing if needed
                updated = False
                for key, value in doc_type_data.items():
                    if key != 'code' and getattr(doc_type, key) != value:
                        setattr(doc_type, key, value)
                        updated = True
                
                if updated:
                    doc_type.save()
                    updated_count += 1
                    self.stdout.write(self.style.WARNING(f'↻ Updated: {doc_type.name}'))
                else:
                    self.stdout.write(f'  Exists: {doc_type.name}')

        self.stdout.write(self.style.SUCCESS(f'\n✓ Seeding complete!'))
        self.stdout.write(f'  Created: {created_count}')
        self.stdout.write(f'  Updated: {updated_count}')
        self.stdout.write(f'  Total: {DocumentTypeConfig.objects.count()}')
