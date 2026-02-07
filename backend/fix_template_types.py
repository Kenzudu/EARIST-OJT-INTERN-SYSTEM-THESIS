
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import DocumentTemplate

mapping = {
    'contract_moa': 'Contract', 
    'waiver': 'Waiver', 
    'acceptance_letter': 'Consent Letter', 
    'endorsement_letter': 'Consent Letter',
    'recommendation': 'Other',
    'certificate': 'Other',
    # Handle others just in case
    'evaluation': 'Evaluation Form',
    'evaluation_form': 'Evaluation Form'
}

count = 0
for t in DocumentTemplate.objects.all():
    if t.template_type in mapping:
        print(f"Updating {t.name}: {t.template_type} -> {mapping[t.template_type]}")
        t.template_type = mapping[t.template_type]
        t.save()
        count += 1
    elif t.template_type not in ['Evaluation Form', 'Waiver', 'Consent Letter', 'Training Plan', 'Contract', 'Other']:
        # Catch any other weird ones
        print(f"Updating {t.name}: {t.template_type} -> Other (Unknown type)")
        t.template_type = 'Other'
        t.save()
        count += 1

print(f"\nSuccessfully updated {count} templates.")
print("Current categories in DB:", set(DocumentTemplate.objects.values_list('template_type', flat=True)))
