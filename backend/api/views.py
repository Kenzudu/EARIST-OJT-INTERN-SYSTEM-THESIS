from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from core.models import StudentProfile, Internship, Company, CompanyUser, Application
from django.shortcuts import get_object_or_404

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already taken"}, status=400)

    user = User.objects.create_user(username=username, email=email, password=password)
    return Response({"message": "User registered successfully!"}, status=201)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get('username')
    password = request.data.get('password')

    # Try to find user by student_id if username lookup might fail or just to be robust
    # We first check if the input matches a student_id
    
    debug_log = []
    debug_log.append(f"Login attempt for input: '{username}'")
    
    original_input = username
    if username:
        username = username.strip()
        
    try:
        # Use iexact for case-insensitive matching
        student_profile = StudentProfile.objects.get(student_id__iexact=username)
        # If found, use the associated user's username
        debug_log.append(f"Found StudentProfile: {student_profile}. User: {student_profile.user.username}")
        username = student_profile.user.username
    except (StudentProfile.DoesNotExist, StudentProfile.MultipleObjectsReturned) as e:
        # If not found as student_id or multiple found, assume it is a username and proceed
        debug_log.append(f"StudentProfile lookup failed: {e}. Treating as username.")
        pass

    user = authenticate(username=username, password=password)
    debug_log.append(f"Authenticate result for username '{username}': {user}")
    
    with open('login_debug.log', 'a') as f:
        f.write('\n'.join(debug_log) + '\n' + '-'*20 + '\n')

    if user is not None:
        token, created = Token.objects.get_or_create(user=user)
        
        # Get user role
        role = "student" # Default
        if hasattr(user, 'user_role'):
            role = user.user_role.role
            
        return Response({
            "message": "Login successful",
            "token": token.key,
            "user": {
                "username": user.username,
                "email": user.email,
                "is_staff": user.is_staff,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": role
            }
        })
    else:
        return Response({"error": "Invalid credentials"}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    return Response({"message": f"Welcome {request.user.username}!"})

# ==========================================
# COMPANY & INTERNSHIP VIEWS
# ==========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def companies(request):
    companies = Company.objects.all()
    data = []
    for c in companies:
        data.append({
            "id": c.id,
            "name": c.name,
            "address": c.address,
            "industry": c.industry,
            "status": c.status
        })
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def company_detail(request, pk):
    company = get_object_or_404(Company, pk=pk)
    return Response({
        "id": company.id,
        "name": company.name,
        "address": company.address,
        "description": company.description,
        "industry": company.industry,
        "status": company.status
    })

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def internships(request):
    print(f"DEBUG: internships view called - Method: {request.method}, User: {request.user}")
    if request.method == 'GET':
        try:
            # If supervisor, show only their company's internships
            # If student/coordinator, show all (or filtered)
            
            user = request.user
            print(f"DEBUG: Fetching internships for user: {user.username}")
            queryset = Internship.objects.all()
            
            # Safer role check
            user_role = None
            try:
                if hasattr(user, 'user_role'):
                    user_role = user.user_role.role
            except Exception as e:
                print(f"DEBUG: Error accessing user_role: {e}")
                user_role = None

            # Check if user is supervisor
            if user_role == 'supervisor':
                print("DEBUG: User is supervisor")
                try:
                    company_user = CompanyUser.objects.get(user=user)
                    queryset = queryset.filter(company=company_user.company)
                except CompanyUser.DoesNotExist:
                    print("DEBUG: Supervisor not linked to company")
                    return Response({"error": "Supervisor not linked to any company"}, status=400)
            elif user_role == 'student':
                print("DEBUG: User is student")
                # For students, only show internships with available slots
                queryset = queryset.filter(slots__gt=0)
            
            print(f"DEBUG: Found {queryset.count()} internships")
            
            data = []
            for i in queryset:
                try:
                    data.append({
                        "id": i.id,
                        "position": i.position,
                        "company_name": i.company.name if i.company else "Unknown",
                        "description": i.description,
                        "slots": i.slots,
                        "location": i.work_location,
                        "duration_hours": getattr(i, 'duration_hours', 0),
                        "type": i.position_type,
                        "created_at": i.created_at
                    })
                except Exception as inner_e:
                    print(f"ERROR processing internship {i.id}: {inner_e}")
                    continue
            return Response(data)
        except Exception as e:
            import traceback
            print(f"ERROR in internships view: {e}")
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)
    
    elif request.method == 'POST':
        try:
            # Create new internship (Supervisor only)
            user = request.user
            
            # Safer role check
            user_role = None
            try:
                if hasattr(user, 'user_role'):
                    user_role = user.user_role.role
            except:
                user_role = None
                
            if user_role != 'supervisor':
                return Response({"error": "Only supervisors can post internships"}, status=403)
                
            try:
                company_user = CompanyUser.objects.get(user=user)
                company = company_user.company
            except CompanyUser.DoesNotExist:
                return Response({"error": "Supervisor not linked to any company"}, status=400)
                
            data = request.data
            print(f"DEBUG: Posting internship with data: {data}")
            
            # Sanitize inputs
            slots = data.get('slots')
            if not slots:
                slots = 1
            else:
                try:
                    slots = int(slots)
                except ValueError:
                    slots = 1
            
            duration_hours = data.get('duration_hours')
            if not duration_hours:
                duration_hours = 300
            else:
                try:
                    duration_hours = int(duration_hours)
                except ValueError:
                    duration_hours = 300

            internship = Internship.objects.create(
                company=company,
                position=data.get('position'),
                description=data.get('description'),
                slots=slots,
                required_skills=data.get('required_skills', ''),
                required_courses=data.get('required_courses', ''),
                work_location=data.get('work_location', ''),
                duration_hours=duration_hours,
                stipend=data.get('stipend', ''),
                position_type=data.get('position_type', 'Full-time')
            )
            
            return Response({
                "message": "Internship posted successfully",
                "id": internship.id
            }, status=201)
        except Exception as e:
            import traceback
            print(f"ERROR in internships POST: {e}")
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def internship_detail(request, pk):
    internship = get_object_or_404(Internship, pk=pk)
    
    # Get supervisors for this company
    supervisors = CompanyUser.objects.filter(company=internship.company)
    supervisor_list = []
    for sup in supervisors:
        supervisor_list.append({
            "name": f"{sup.user.first_name} {sup.user.last_name}",
            "position": sup.position,
            "email": sup.user.email,
            "phone": sup.phone
        })

    return Response({
        "id": internship.id,
        "position": internship.position,
        "company": {
            "id": internship.company.id,
            "name": internship.company.name,
            "address": internship.company.address,
            "contact_person": internship.company.contact_person,
            "contact_email": internship.company.contact_email,
            "phone": internship.company.phone,
            "website": internship.company.website
        },
        "supervisors": supervisor_list,
        "description": internship.description,
        "slots": internship.slots,
        "required_skills": internship.required_skills,
        "required_courses": internship.required_courses,
        "work_location": internship.work_location,
        "duration_hours": internship.duration_hours,
        "stipend": internship.stipend,
        "position_type": internship.position_type,
        "created_at": internship.created_at
    })

# ==========================================
# APPLICATION VIEWS
# ==========================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_application_status(request, pk):
    """
    Update application status (e.g., Approve/Hire).
    If Approved, decrement internship slots.
    """
    application = get_object_or_404(Application, pk=pk)
    user = request.user
    
    # Check permissions (only supervisor of the company or coordinator/admin)
    is_authorized = False
    if hasattr(user, 'user_role'):
        if user.user_role.role in ['admin', 'coordinator']:
            is_authorized = True
        elif user.user_role.role == 'supervisor':
            # Check if supervisor belongs to the company of the internship
            try:
                company_user = CompanyUser.objects.get(user=user)
                if company_user.company == application.internship.company:
                    is_authorized = True
            except CompanyUser.DoesNotExist:
                pass
    
    if not is_authorized:
        return Response({"error": "Permission denied"}, status=403)
        
    new_status = request.data.get('status')
    if not new_status:
        return Response({"error": "Status is required"}, status=400)
        
    # Logic for hiring
    if new_status == 'Approved' and application.status != 'Approved':
        internship = application.internship
        if internship.slots > 0:
            internship.slots -= 1
            internship.save()
            
            # Update application
            application.status = 'Approved'
            application.save()
            
            return Response({"message": "Application approved and slot deducted"})
        else:
            return Response({"error": "No slots available for this internship"}, status=400)
            
    # Logic for other status updates
    application.status = new_status
    application.save()
    return Response({"message": f"Application status updated to {new_status}"})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def applications(request):
    # Placeholder for applications list
    return Response([])

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def application_detail(request, pk):
    # Placeholder
    return Response({})
