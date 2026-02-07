
import os
import django
from django.db.models import Q

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import DocumentTemplate

print("Refining template categories based on filenames/names...")

def refine_category(keyword, new_category):
    # Find templates that match the keyword but aren't already in the category
    templates = DocumentTemplate.objects.filter(
        Q(name__icontains=keyword) | Q(file__icontains=keyword)
    ).exclude(template_type=new_category)
    
    count = templates.count()
    if count > 0:
        print(f"Found {count} items for '{keyword}' -> '{new_category}'")
        for t in templates:
            old_type = t.template_type
            t.template_type = new_category
            t.save()
            print(f"  - Updated '{t.name}' ({old_type} -> {new_category})")
    else:
        print(f"No items found needing update for '{keyword}'")

# Run refinements
refine_category('endorsement', 'Endorsement Letter')
refine_category('acceptance', 'Acceptance Letter')
refine_category('medical', 'Medical Certificate')
refine_category('waiver', 'Waiver')
refine_category('contract', 'Contract')
refine_category('evaluation', 'Evaluation Form')

print("\nFinal Breakdown:")
for t_type in DocumentTemplate.objects.values_list('template_type', flat=True).distinct():
    count = DocumentTemplate.objects.filter(template_type=t_type).count()
    print(f"  {t_type}: {count}")
