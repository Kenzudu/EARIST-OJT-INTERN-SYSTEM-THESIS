from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django import forms
from .models import Company, Internship, Application

# --- Inline to show Applications in User admin ---
class ApplicationInline(admin.TabularInline):
    model = Application
    extra = 0
    readonly_fields = ('internship', 'status', 'applied_at')  # admin can see only

# --- Extend User admin ---
class UserAdmin(BaseUserAdmin):
    inlines = BaseUserAdmin.inlines + (ApplicationInline,)

# Unregister default User admin and register the new one
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

# --- Company Form with Target Colleges ---
class CompanyAdminForm(forms.ModelForm):
    target_colleges = forms.MultipleChoiceField(
        choices=Company.COLLEGE_CHOICES,
        widget=forms.CheckboxSelectMultiple,
        required=False,
        help_text="Select which colleges this company is targeting for recruitment"
    )
    
    class Meta:
        model = Company
        fields = '__all__'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk and self.instance.target_colleges:
            self.initial['target_colleges'] = self.instance.target_colleges
    
    def save(self, commit=True):
        instance = super().save(commit=False)
        instance.target_colleges = self.cleaned_data.get('target_colleges', [])
        if commit:
            instance.save()
        return instance

# --- Register Company ---
@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    form = CompanyAdminForm
    list_display = ('name', 'contact_person', 'contact_email', 'get_target_colleges', 'status')
    search_fields = ('name', 'contact_person', 'contact_email')
    list_filter = ('status',)
    
    fieldsets = (
        ('Company Information', {
            'fields': ('name', 'address', 'industry', 'description', 'status')
        }),
        ('Contact Details', {
            'fields': ('contact_person', 'contact_email', 'phone', 'website')
        }),
        ('Target Colleges', {
            'fields': ('target_colleges',),
            'description': 'Select which colleges this company is recruiting from'
        }),
    )
    
    def get_target_colleges(self, obj):
        if obj.target_colleges:
            return ', '.join(obj.target_colleges)
        return 'None'
    get_target_colleges.short_description = 'Target Colleges'

# --- Register Internship ---
@admin.register(Internship)
class InternshipAdmin(admin.ModelAdmin):
    list_display = ('position', 'company', 'slots', 'created_at')
    list_filter = ('company',)

# --- Register Application ---
@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('student', 'internship', 'status', 'applied_at')
    list_filter = ('status', 'internship__company')
    search_fields = ('student__username', 'internship__position')
