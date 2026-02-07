#!/usr/bin/env python
"""
Script to populate the database with dummy companies for each college
Usage: python populate_companies.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import Company

def populate_companies():
    """Delete all companies and create dummy companies for each college"""
    
    # Delete all existing companies
    print("🗑️  Deleting all existing companies...")
    deleted_count = Company.objects.all().delete()[0]
    print(f"   Deleted {deleted_count} companies")
    
    print("\n📝 Creating dummy companies for each college...\n")
    
    # CCS - College of Computing Studies
    ccs_companies = [
        {
            'name': 'TechNova Solutions Inc.',
            'address': '15th Floor, Cyber One Building, Eastwood City, Quezon City',
            'contact_person': 'Maria Santos',
            'contact_email': 'hr@technova.ph',
            'phone': '+63 2 8123 4567',
            'website': 'https://www.technova.ph',
            'industry': 'Information Technology',
            'description': 'Leading software development company specializing in web and mobile applications, cloud solutions, and AI integration. We work with Fortune 500 clients and startups alike.',
            'status': 'Approved',
            'target_colleges': ['CCS']
        },
        {
            'name': 'DataCore Analytics Corp.',
            'address': '8th Floor, The Podium Tower, Ortigas Center, Mandaluyong City',
            'contact_person': 'John Reyes',
            'contact_email': 'careers@datacore.com.ph',
            'phone': '+63 2 8234 5678',
            'website': 'https://www.datacore.com.ph',
            'industry': 'Data Science & Analytics',
            'description': 'Premier data analytics firm providing business intelligence, machine learning, and big data solutions. We help companies make data-driven decisions.',
            'status': 'Approved',
            'target_colleges': ['CCS']
        },
        {
            'name': 'CyberShield Security Systems',
            'address': '22nd Floor, Robinsons Cybergate Tower 3, EDSA, Mandaluyong City',
            'contact_person': 'Angela Cruz',
            'contact_email': 'recruitment@cybershield.ph',
            'phone': '+63 2 8345 6789',
            'website': 'https://www.cybershield.ph',
            'industry': 'Cybersecurity',
            'description': 'Cybersecurity company offering penetration testing, security audits, and managed security services. Protecting businesses from digital threats.',
            'status': 'Approved',
            'target_colleges': ['CCS']
        }
    ]
    
    # CBA - College of Business Administration
    cba_companies = [
        {
            'name': 'Metro Bank Philippines',
            'address': 'Metro Bank Plaza, Sen. Gil Puyat Avenue, Makati City',
            'contact_person': 'Roberto Tan',
            'contact_email': 'hr.recruitment@metrobank.ph',
            'phone': '+63 2 8456 7890',
            'website': 'https://www.metrobank.ph',
            'industry': 'Banking & Finance',
            'description': 'One of the largest banks in the Philippines offering comprehensive banking services, investment products, and financial solutions to individuals and corporations.',
            'status': 'Approved',
            'target_colleges': ['CBA']
        },
        {
            'name': 'PrimeConsult Management Group',
            'address': '18th Floor, Ayala Tower One, Ayala Avenue, Makati City',
            'contact_person': 'Patricia Lim',
            'contact_email': 'careers@primeconsult.ph',
            'phone': '+63 2 8567 8901',
            'website': 'https://www.primeconsult.ph',
            'industry': 'Business Consulting',
            'description': 'Management consulting firm specializing in strategy, operations, and organizational development. We help businesses optimize performance and achieve growth.',
            'status': 'Approved',
            'target_colleges': ['CBA']
        },
        {
            'name': 'GlobalTrade Marketing Corp.',
            'address': '12th Floor, Tektite Tower, Exchange Road, Ortigas Center, Pasig City',
            'contact_person': 'Michael Garcia',
            'contact_email': 'hr@globaltrade.ph',
            'phone': '+63 2 8678 9012',
            'website': 'https://www.globaltrade.ph',
            'industry': 'Marketing & Advertising',
            'description': 'Full-service marketing agency providing brand strategy, digital marketing, social media management, and creative services for local and international brands.',
            'status': 'Approved',
            'target_colleges': ['CBA']
        }
    ]
    
    # COE - College of Engineering
    coe_companies = [
        {
            'name': 'BuildRight Construction Inc.',
            'address': '5th Floor, Greenfield Tower, Mayflower Street, Mandaluyong City',
            'contact_person': 'Engr. Carlos Mendoza',
            'contact_email': 'recruitment@buildright.ph',
            'phone': '+63 2 8789 0123',
            'website': 'https://www.buildright.ph',
            'industry': 'Construction & Engineering',
            'description': 'Leading construction company specializing in residential, commercial, and infrastructure projects. We build the future of the Philippines.',
            'status': 'Approved',
            'target_colleges': ['COE']
        },
        {
            'name': 'PowerGen Energy Solutions',
            'address': '10th Floor, Energy Center Building, BGC, Taguig City',
            'contact_person': 'Engr. Sarah Villanueva',
            'contact_email': 'careers@powergen.ph',
            'phone': '+63 2 8890 1234',
            'website': 'https://www.powergen.ph',
            'industry': 'Energy & Utilities',
            'description': 'Renewable energy company focused on solar, wind, and hydroelectric power generation. Committed to sustainable energy solutions for the Philippines.',
            'status': 'Approved',
            'target_colleges': ['COE']
        },
        {
            'name': 'AutoTech Manufacturing Corp.',
            'address': 'Laguna Technopark, Biñan, Laguna',
            'contact_person': 'Engr. Ramon Santos',
            'contact_email': 'hr@autotech.ph',
            'phone': '+63 49 511 2345',
            'website': 'https://www.autotech.ph',
            'industry': 'Automotive Manufacturing',
            'description': 'Automotive parts manufacturer supplying components to major car brands. We combine precision engineering with innovative manufacturing processes.',
            'status': 'Approved',
            'target_colleges': ['COE']
        }
    ]
    
    # CAS - College of Arts and Sciences
    cas_companies = [
        {
            'name': 'BioResearch Laboratories Inc.',
            'address': 'Science Hub, UP Technology Park, Diliman, Quezon City',
            'contact_person': 'Dr. Elena Rodriguez',
            'contact_email': 'careers@bioresearch.ph',
            'phone': '+63 2 8901 2345',
            'website': 'https://www.bioresearch.ph',
            'industry': 'Biotechnology & Research',
            'description': 'Research laboratory conducting cutting-edge studies in molecular biology, genetics, and pharmaceutical development. Contributing to medical breakthroughs.',
            'status': 'Approved',
            'target_colleges': ['CAS']
        },
        {
            'name': 'Creative Minds Publishing House',
            'address': '7th Floor, Quad Alpha Centrum, 125 Pioneer Street, Mandaluyong City',
            'contact_person': 'Anna Marie Torres',
            'contact_email': 'hr@creativeminds.ph',
            'phone': '+63 2 8012 3456',
            'website': 'https://www.creativeminds.ph',
            'industry': 'Publishing & Media',
            'description': 'Publishing company producing educational materials, literary works, and digital content. We bring stories and knowledge to life.',
            'status': 'Approved',
            'target_colleges': ['CAS']
        },
        {
            'name': 'EcoGreen Environmental Services',
            'address': '3rd Floor, Green Building, Ortigas Avenue, Pasig City',
            'contact_person': 'Dr. Mark Fernandez',
            'contact_email': 'recruitment@ecogreen.ph',
            'phone': '+63 2 8123 4560',
            'website': 'https://www.ecogreen.ph',
            'industry': 'Environmental Science',
            'description': 'Environmental consulting firm providing sustainability assessments, waste management solutions, and environmental impact studies for businesses.',
            'status': 'Approved',
            'target_colleges': ['CAS']
        }
    ]
    
    # CED - College of Education
    ced_companies = [
        {
            'name': 'Bright Future Learning Center',
            'address': '2nd Floor, Education Plaza, Quezon Avenue, Quezon City',
            'contact_person': 'Dr. Linda Martinez',
            'contact_email': 'hr@brightfuture.ph',
            'phone': '+63 2 8111 2222',
            'website': 'https://www.brightfuture.ph',
            'industry': 'Education & Training',
            'description': 'Leading educational institution providing quality primary and secondary education. We nurture young minds for a brighter tomorrow.',
            'status': 'Approved',
            'target_colleges': ['CED']
        },
        {
            'name': 'Knowledge Academy Philippines',
            'address': '5th Floor, Academic Tower, Taft Avenue, Manila',
            'contact_person': 'Prof. Ricardo Santos',
            'contact_email': 'careers@knowledgeacademy.ph',
            'phone': '+63 2 8222 3333',
            'website': 'https://www.knowledgeacademy.ph',
            'industry': 'Educational Services',
            'description': 'Review center and tutorial services helping students excel in academics and standardized tests. Excellence in education is our mission.',
            'status': 'Approved',
            'target_colleges': ['CED']
        },
        {
            'name': 'EduTech Solutions Inc.',
            'address': '11th Floor, Innovation Hub, Ortigas Center, Pasig City',
            'contact_person': 'Ms. Jennifer Lim',
            'contact_email': 'recruitment@edutech.ph',
            'phone': '+63 2 8333 4444',
            'website': 'https://www.edutech.ph',
            'industry': 'Educational Technology',
            'description': 'EdTech company developing innovative learning platforms and digital educational content for schools nationwide.',
            'status': 'Approved',
            'target_colleges': ['CED']
        }
    ]
    
    # CEN - College of Engineering
    cen_companies = [
        {
            'name': 'BuildRight Construction Inc.',
            'address': '5th Floor, Greenfield Tower, Mayflower Street, Mandaluyong City',
            'contact_person': 'Engr. Carlos Mendoza',
            'contact_email': 'recruitment@buildright.ph',
            'phone': '+63 2 8789 0123',
            'website': 'https://www.buildright.ph',
            'industry': 'Construction & Engineering',
            'description': 'Leading construction company specializing in residential, commercial, and infrastructure projects. We build the future of the Philippines.',
            'status': 'Approved',
            'target_colleges': ['CEN']
        },
        {
            'name': 'PowerGen Energy Solutions',
            'address': '10th Floor, Energy Center Building, BGC, Taguig City',
            'contact_person': 'Engr. Sarah Villanueva',
            'contact_email': 'careers@powergen.ph',
            'phone': '+63 2 8890 1234',
            'website': 'https://www.powergen.ph',
            'industry': 'Energy & Utilities',
            'description': 'Renewable energy company focused on solar, wind, and hydroelectric power generation. Committed to sustainable energy solutions for the Philippines.',
            'status': 'Approved',
            'target_colleges': ['CEN']
        },
        {
            'name': 'AutoTech Manufacturing Corp.',
            'address': 'Laguna Technopark, Biñan, Laguna',
            'contact_person': 'Engr. Ramon Santos',
            'contact_email': 'hr@autotech.ph',
            'phone': '+63 49 511 2345',
            'website': 'https://www.autotech.ph',
            'industry': 'Automotive Manufacturing',
            'description': 'Automotive parts manufacturer supplying components to major car brands. We combine precision engineering with innovative manufacturing processes.',
            'status': 'Approved',
            'target_colleges': ['CEN']
        }
    ]
    
    # CHM - College of Hospitality Management
    chm_companies = [
        {
            'name': 'Grand Manila Hotel & Resort',
            'address': 'Roxas Boulevard, Pasay City, Metro Manila',
            'contact_person': 'Ms. Catherine Reyes',
            'contact_email': 'hr@grandmanila.ph',
            'phone': '+63 2 8234 5601',
            'website': 'https://www.grandmanila.ph',
            'industry': 'Hospitality & Hotels',
            'description': '5-star luxury hotel offering world-class accommodations, fine dining, and event facilities. Experience Filipino hospitality at its finest.',
            'status': 'Approved',
            'target_colleges': ['CHM']
        },
        {
            'name': 'Paradise Tours & Travel Agency',
            'address': '9th Floor, SM Megamall, EDSA, Mandaluyong City',
            'contact_person': 'Joseph Cruz',
            'contact_email': 'careers@paradisetours.ph',
            'phone': '+63 2 8345 6012',
            'website': 'https://www.paradisetours.ph',
            'industry': 'Tourism & Travel',
            'description': 'Premier travel agency specializing in domestic and international tour packages, corporate travel, and destination management services.',
            'status': 'Approved',
            'target_colleges': ['CHM']
        },
        {
            'name': 'Flavors Restaurant Group',
            'address': 'BGC Central Square, Bonifacio Global City, Taguig',
            'contact_person': 'Chef Marco Antonio',
            'contact_email': 'hr@flavorsgroup.ph',
            'phone': '+63 2 8456 0123',
            'website': 'https://www.flavorsgroup.ph',
            'industry': 'Food & Beverage',
            'description': 'Restaurant group operating multiple dining concepts from casual to fine dining. We celebrate Filipino and international cuisine.',
            'status': 'Approved',
            'target_colleges': ['CHM']
        }
    ]
    
    # CIT - College of Industrial Technology
    cit_companies = [
        {
            'name': 'PrecisionTech Manufacturing',
            'address': 'PEZA Industrial Park, Cavite Export Processing Zone, Rosario, Cavite',
            'contact_person': 'Engr. Antonio Reyes',
            'contact_email': 'hr@precisiontech.ph',
            'phone': '+63 46 437 8888',
            'website': 'https://www.precisiontech.ph',
            'industry': 'Industrial Manufacturing',
            'description': 'Precision manufacturing company specializing in metal fabrication, CNC machining, and industrial automation solutions.',
            'status': 'Approved',
            'target_colleges': ['CIT']
        },
        {
            'name': 'MechPro Industrial Services',
            'address': '4th Floor, Industrial Complex, C5 Road, Taguig City',
            'contact_person': 'Engr. Roberto Cruz',
            'contact_email': 'careers@mechpro.ph',
            'phone': '+63 2 8444 5555',
            'website': 'https://www.mechpro.ph',
            'industry': 'Industrial Maintenance',
            'description': 'Industrial maintenance and repair services provider for manufacturing plants and production facilities nationwide.',
            'status': 'Approved',
            'target_colleges': ['CIT']
        },
        {
            'name': 'ElectroWorks Corporation',
            'address': 'Bataan Economic Zone, Mariveles, Bataan',
            'contact_person': 'Engr. Maria Santos',
            'contact_email': 'recruitment@electroworks.ph',
            'phone': '+63 47 935 6666',
            'website': 'https://www.electroworks.ph',
            'industry': 'Electronics Manufacturing',
            'description': 'Electronics manufacturing company producing components for consumer electronics and industrial equipment.',
            'status': 'Approved',
            'target_colleges': ['CIT']
        }
    ]
    
    # CPAC - College of Public Administration and Criminology
    cpac_companies = [
        {
            'name': 'SecureGuard Security Agency',
            'address': '6th Floor, Security Plaza, Quezon Avenue, Quezon City',
            'contact_person': 'Col. (Ret.) Benjamin Torres',
            'contact_email': 'hr@secureguard.ph',
            'phone': '+63 2 8555 6666',
            'website': 'https://www.secureguard.ph',
            'industry': 'Security Services',
            'description': 'Leading security agency providing professional security guards, investigation services, and security consulting for businesses and institutions.',
            'status': 'Approved',
            'target_colleges': ['CPAC']
        },
        {
            'name': 'Metro Justice Legal Services',
            'address': '14th Floor, Justice Tower, Padre Faura, Manila',
            'contact_person': 'Atty. Patricia Gonzales',
            'contact_email': 'careers@metrojustice.ph',
            'phone': '+63 2 8666 7777',
            'website': 'https://www.metrojustice.ph',
            'industry': 'Legal Services',
            'description': 'Law firm specializing in criminal law, public administration, and legal consulting services for government and private sectors.',
            'status': 'Approved',
            'target_colleges': ['CPAC']
        },
        {
            'name': 'GovServe Consultancy Group',
            'address': '9th Floor, Government Center, Commonwealth Avenue, Quezon City',
            'contact_person': 'Dr. Fernando Ramos',
            'contact_email': 'recruitment@govserve.ph',
            'phone': '+63 2 8777 8888',
            'website': 'https://www.govserve.ph',
            'industry': 'Public Administration',
            'description': 'Consultancy firm providing governance solutions, policy development, and public administration training for government agencies.',
            'status': 'Approved',
            'target_colleges': ['CPAC']
        }
    ]
    
    # CAFA - College of Architecture and Fine Arts
    cafa_companies = [
        {
            'name': 'UrbanDesign Architects',
            'address': '12th Floor, Design Center, Rockwell, Makati City',
            'contact_person': 'Ar. Miguel Santos',
            'contact_email': 'hr@urbandesign.ph',
            'phone': '+63 2 8888 9999',
            'website': 'https://www.urbandesign.ph',
            'industry': 'Architecture & Design',
            'description': 'Award-winning architectural firm specializing in sustainable design, urban planning, and innovative building solutions.',
            'status': 'Approved',
            'target_colleges': ['CAFA']
        },
        {
            'name': 'ArtVision Creative Studio',
            'address': '3rd Floor, Arts District, Bonifacio High Street, BGC, Taguig',
            'contact_person': 'Ms. Isabella Cruz',
            'contact_email': 'careers@artvision.ph',
            'phone': '+63 2 8999 0000',
            'website': 'https://www.artvision.ph',
            'industry': 'Creative Arts & Design',
            'description': 'Creative studio offering graphic design, branding, illustration, and multimedia production services for diverse clients.',
            'status': 'Approved',
            'target_colleges': ['CAFA']
        },
        {
            'name': 'Heritage Restoration Corp.',
            'address': 'Intramuros, Manila',
            'contact_person': 'Ar. Carlos Mendoza',
            'contact_email': 'recruitment@heritage.ph',
            'phone': '+63 2 8000 1111',
            'website': 'https://www.heritage.ph',
            'industry': 'Architectural Conservation',
            'description': 'Specialized firm in heritage conservation, restoration of historical buildings, and preservation of cultural landmarks.',
            'status': 'Approved',
            'target_colleges': ['CAFA']
        }
    ]
    
    # Combine all companies
    all_companies = ccs_companies + cba_companies + cen_companies + cas_companies + chm_companies + ced_companies + cit_companies + cpac_companies + cafa_companies
    
    # Create companies
    created_count = 0
    for company_data in all_companies:
        company = Company.objects.create(**company_data)
        created_count += 1
        colleges = ', '.join(company.target_colleges)
        print(f"✅ Created: {company.name} (Target: {colleges})")
    
    print(f"\n🎉 Successfully created {created_count} companies!")
    print("\nBreakdown by college:")
    print(f"   CCS: {len(ccs_companies)} companies")
    print(f"   CBA: {len(cba_companies)} companies")
    print(f"   CEN: {len(cen_companies)} companies")
    print(f"   CAS: {len(cas_companies)} companies")
    print(f"   CHM: {len(chm_companies)} companies")
    print(f"   CED: {len(ced_companies)} companies")
    print(f"   CIT: {len(cit_companies)} companies")
    print(f"   CPAC: {len(cpac_companies)} companies")
    print(f"   CAFA: {len(cafa_companies)} companies")

if __name__ == "__main__":
    print("=" * 60)
    print("🏢 Company Database Population Script")
    print("=" * 60)
    populate_companies()
    print("\n✨ Done!")
