"""
PDF Report Generator with Charts for Internship Analytics
"""
import io
import os
from datetime import datetime
from django.conf import settings
from django.http import HttpResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.pdfgen import canvas
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.backends.backend_agg import FigureCanvasAgg


def create_bar_chart(data, title, xlabel, ylabel, filename):
    """Create a bar chart and save as image"""
    if not data:
        return None
    
    fig, ax = plt.subplots(figsize=(10, 6))
    
    if isinstance(data, dict):
        categories = list(data.keys())
        values = list(data.values())
    elif isinstance(data, list):
        if data and isinstance(data[0], dict):
            categories = [item.get('company', item.get('course', '')) for item in data[:10]]
            values = [item.get('count', item.get('student_count', item.get('internship_count', 0))) for item in data[:10]]
        else:
            categories = [str(i) for i in range(len(data))]
            values = data
    else:
        return None
    
    if not categories or not values or all(v == 0 for v in values):
        plt.close()
        return None
    
    bars = ax.bar(categories, values, color=['#004AAD', '#0066CC', '#0080FF', '#3399FF', '#66B2FF'])
    
    ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
    ax.set_xlabel(xlabel, fontsize=11)
    ax.set_ylabel(ylabel, fontsize=11)
    ax.grid(axis='y', alpha=0.3, linestyle='--')
    
    # Rotate x-axis labels if needed
    if len(max(categories, key=len)) > 10:
        plt.xticks(rotation=45, ha='right')
    
    # Add value labels on bars
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
                f'{int(height)}',
                ha='center', va='bottom', fontsize=9)
    
    plt.tight_layout()
    
    # Save to buffer
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png', dpi=100, bbox_inches='tight')
    buffer.seek(0)
    plt.close()
    
    return buffer


def create_pie_chart(data, title, filename):
    """Create a pie chart and save as image"""
    fig, ax = plt.subplots(figsize=(8, 8))
    
    if isinstance(data, dict):
        labels = list(data.keys())
        values = list(data.values())
    else:
        return None
    
    colors_list = ['#004AAD', '#0066CC', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181']
    
    wedges, texts, autotexts = ax.pie(values, labels=labels, autopct='%1.1f%%',
                                       colors=colors_list[:len(values)],
                                       startangle=90, textprops={'fontsize': 10})
    
    ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
    
    plt.tight_layout()
    
    # Save to buffer
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png', dpi=100, bbox_inches='tight')
    buffer.seek(0)
    plt.close()
    
    return buffer


def create_line_chart(data, title, xlabel, ylabel, filename):
    """Create a line chart for time series data"""
    fig, ax = plt.subplots(figsize=(10, 6))
    
    # For now, create a simple line chart
    if isinstance(data, dict):
        x = list(data.keys())
        y = list(data.values())
    else:
        return None
    
    ax.plot(x, y, marker='o', linewidth=2, markersize=8, color='#004AAD')
    ax.fill_between(x, y, alpha=0.3, color='#004AAD')
    
    ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
    ax.set_xlabel(xlabel, fontsize=11)
    ax.set_ylabel(ylabel, fontsize=11)
    ax.grid(True, alpha=0.3, linestyle='--')
    
    plt.tight_layout()
    
    # Save to buffer
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png', dpi=100, bbox_inches='tight')
    buffer.seek(0)
    plt.close()
    
    return buffer


def generate_pdf_report(report_data, output_path=None):
    """Generate a comprehensive PDF report with charts"""
    try:
        # Create a BytesIO buffer if no output path is provided
        if output_path is None:
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter,
                                   rightMargin=72, leftMargin=72,
                                   topMargin=72, bottomMargin=18)
        else:
            doc = SimpleDocTemplate(output_path, pagesize=letter,
                                   rightMargin=72, leftMargin=72,
                                   topMargin=72, bottomMargin=18)
        
        # Container for the 'Flowable' objects
        elements = []
        
        # Define styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#004AAD'),
            spaceAfter=30,
            alignment=1,  # Center alignment
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#004AAD'),
            spaceAfter=12,
            spaceBefore=12,
        )
        
        # Title
        title = Paragraph("EARIST INTERNSHIP SYSTEM", title_style)
        elements.append(title)
        elements.append(Spacer(1, 0.1*inch))
        
        subtitle = Paragraph("Comprehensive Analytics Report", styles['Heading2'])
        elements.append(subtitle)
        elements.append(Spacer(1, 0.2*inch))
        
        # Report metadata - handle datetime parsing
        try:
            report_date_str = report_data['report_generated_at']
            if 'Z' in report_date_str:
                report_date_str = report_date_str.replace('Z', '+00:00')
            report_date = datetime.fromisoformat(report_date_str)
            formatted_date = report_date.strftime('%B %d, %Y at %I:%M %p')
        except:
            formatted_date = report_data['report_generated_at']
        
        metadata_text = f"""
        <b>Generated:</b> {formatted_date}<br/>
        <b>Generated by:</b> {report_data['generated_by']}
        """
        elements.append(Paragraph(metadata_text, styles['Normal']))
        elements.append(Spacer(1, 0.3*inch))
        
        # Summary Statistics Section
        elements.append(Paragraph("Summary Statistics", heading_style))
        
        summary_data = report_data['summary']
        summary_table_data = [
            ['Metric', 'Value'],
            ['Total Users', str(summary_data['total_users'])],
            ['Total Students', str(summary_data['total_students'])],
            ['Total Admins', str(summary_data['total_admins'])],
            ['Total Companies', str(summary_data['total_companies'])],
            ['Total Internships', str(summary_data['total_internships'])],
            ['Total Applications', str(summary_data['total_applications'])],
        ]
        
        summary_table = Table(summary_table_data, colWidths=[4*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#004AAD')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Application Metrics Section with Pie Chart
        elements.append(Paragraph("Application Metrics", heading_style))
        
        app_metrics = report_data['application_metrics']
        app_status_data = {
            'Pending': app_metrics['pending'],
            'Approved': app_metrics['approved'],
            'Rejected': app_metrics['rejected']
        }
        
        # Create pie chart for application status
        pie_chart_buffer = create_pie_chart(app_status_data, 'Application Status Distribution', 'app_status.png')
        if pie_chart_buffer:
            pie_img = Image(pie_chart_buffer, width=5*inch, height=5*inch)
            elements.append(pie_img)
            elements.append(Spacer(1, 0.2*inch))
        
        # Application metrics table
        app_table_data = [
        ['Metric', 'Value'],
        ['Pending Applications', str(app_metrics['pending'])],
        ['Approved Applications', str(app_metrics['approved'])],
        ['Rejected Applications', str(app_metrics['rejected'])],
        ['Approval Rate', f"{app_metrics['approval_rate']}%"],
        ['Rejection Rate', f"{app_metrics['rejection_rate']}%"],
        ['Recent Applications (30 days)', str(app_metrics['recent_applications_30_days'])],
        ['Recent Approvals (30 days)', str(app_metrics['recent_approvals_30_days'])],
        ]
        
        app_table = Table(app_table_data, colWidths=[4*inch, 2*inch])
        app_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#004AAD')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        elements.append(app_table)
        elements.append(PageBreak())
        
        # Student Engagement Section
        elements.append(Paragraph("Student Engagement", heading_style))
        
        engagement = report_data['student_engagement']
        engagement_table_data = [
            ['Metric', 'Value'],
            ['Students with Applications', str(engagement['students_with_applications'])],
            ['Students with Profiles', str(engagement['students_with_profiles'])],
            ['Profile Completion Rate', f"{engagement['profile_completion_rate']}%"],
            ['Application Rate', f"{engagement['application_rate']}%"],
        ]
        
        engagement_table = Table(engagement_table_data, colWidths=[4*inch, 2*inch])
        engagement_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#004AAD')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        elements.append(engagement_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Course Distribution Bar Chart
        if report_data.get('course_distribution'):
            elements.append(Paragraph("Course Distribution", heading_style))
            course_chart_buffer = create_bar_chart(
                report_data['course_distribution'],
                'Student Distribution by Course',
                'Course',
                'Number of Students',
                'course_distribution.png'
            )
            if course_chart_buffer:
                course_img = Image(course_chart_buffer, width=6.5*inch, height=4*inch)
                elements.append(course_img)
                elements.append(Spacer(1, 0.2*inch))
        
        elements.append(PageBreak())
        
        # Internship Analytics Section
        elements.append(Paragraph("Internship Analytics", heading_style))
        
        internship_analytics = report_data['internship_analytics']
        internship_table_data = [
            ['Metric', 'Value'],
            ['Total Internships', str(internship_analytics['total_internships'])],
            ['Internships with Applications', str(internship_analytics['internships_with_applications'])],
            ['Average Applications per Internship', f"{internship_analytics['avg_applications_per_internship']:.2f}"],
        ]
        
        internship_table = Table(internship_table_data, colWidths=[4*inch, 2*inch])
        internship_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#004AAD')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        elements.append(internship_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Top Companies by Internships Bar Chart
        if internship_analytics.get('top_companies_by_internships'):
            elements.append(Paragraph("Top Companies by Internship Count", heading_style))
            companies_chart_buffer = create_bar_chart(
                internship_analytics['top_companies_by_internships'],
                'Top Companies by Number of Internships',
                'Company',
                'Number of Internships',
                'top_companies.png'
            )
            if companies_chart_buffer:
                companies_img = Image(companies_chart_buffer, width=6.5*inch, height=4*inch)
                elements.append(companies_img)
                elements.append(Spacer(1, 0.2*inch))
        
        elements.append(PageBreak())
        
        # Top Performing Companies Section
        if report_data.get('top_performing_companies'):
            elements.append(Paragraph("Top Performing Companies", heading_style))
            
            top_companies = report_data['top_performing_companies'][:10]
            if top_companies:
                # Create bar chart for top performing companies
                top_companies_data = {
                    item['company']: item['approval_rate']
                    for item in top_companies
                }
                top_companies_chart_buffer = create_bar_chart(
                    top_companies_data,
                    'Top Companies by Approval Rate',
                    'Company',
                    'Approval Rate (%)',
                    'top_performing.png'
                )
                if top_companies_chart_buffer:
                    top_companies_img = Image(top_companies_chart_buffer, width=6.5*inch, height=4*inch)
                    elements.append(top_companies_img)
                    elements.append(Spacer(1, 0.2*inch))
                
                # Table with details
                top_companies_table_data = [['Company', 'Total Apps', 'Approved', 'Approval Rate (%)']]
                for item in top_companies:
                    top_companies_table_data.append([
                        item['company'],
                        str(item['total_applications']),
                        str(item['approved_applications']),
                        f"{item['approval_rate']}%"
                    ])
                
                top_companies_table = Table(top_companies_table_data, colWidths=[3*inch, 1.5*inch, 1.5*inch, 1.5*inch])
                top_companies_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#004AAD')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 11),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
                ]))
                elements.append(top_companies_table)
        
        elements.append(Spacer(1, 0.3*inch))
        
        # Activity Metrics Section
        elements.append(Paragraph("Activity Metrics", heading_style))
        
        activity = report_data['activity_metrics']
        activity_table_data = [
            ['Metric', 'Value'],
            ['Total Activity Logs', str(activity['total_activity_logs'])],
            ['Recent Activity (30 days)', str(activity['recent_activity_30_days'])],
        ]
        
        activity_table = Table(activity_table_data, colWidths=[4*inch, 2*inch])
        activity_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#004AAD')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        elements.append(activity_table)
        
        # Footer
        elements.append(Spacer(1, 0.5*inch))
        footer_text = f"<i>Report generated on {formatted_date} by {report_data['generated_by']}</i>"
        elements.append(Paragraph(footer_text, styles['Normal']))
        
        # Build PDF
        doc.build(elements)
        
        if output_path is None:
            buffer.seek(0)
            return buffer
        
        return None
    except Exception as e:
        import traceback
        print(f"Error generating PDF report: {str(e)}")
        print(traceback.format_exc())
        return None

