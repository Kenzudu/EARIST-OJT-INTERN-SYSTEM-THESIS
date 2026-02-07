def create_moa_contract(company, coordinator):
    """Generate Memorandum of Agreement between EARIST and Company"""
    doc = Document()
    add_earist_header(doc)
    add_earist_footer(doc)
    
    # Title
    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("MEMORANDUM OF AGREEMENT")
    run.font.size = Pt(16)
    run.font.bold = True
    
    doc.add_paragraph()
    
    # Opening
    opening = doc.add_paragraph()
    opening.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = opening.add_run("KNOW ALL MEN BY THESE PRESENTS:")
    run.font.bold = True
    
    doc.add_paragraph()
    
    # Introduction
    intro = doc.add_paragraph()
    intro.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    intro.add_run(
        "This memorandum of agreement is entered into by and between the following:"
    )
    
    doc.add_paragraph()
    
    # First Party - EARIST
    p1 = doc.add_paragraph()
    p1.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    run = p1.add_run("FISHER VALLEY COLLEGE")
    run.font.bold = True
    p1.add_run(
        ", (An educational institution, duly organized and registered "
        "under the laws and regulations of the government located at No. 5, Manuel L. Quezon St., Hagomy, "
        "Taguig City represented by its President, Atty. Ronald R. Yap, referred to as the "
    )
    run = p1.add_run("FIRST PARTY")
    run.font.bold = True
    p1.add_run(",")
    
    doc.add_paragraph()
    
    # "and"
    and_para = doc.add_paragraph()
    and_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    and_para.add_run("and")
    
    doc.add_paragraph()
    
    # Second Party - Company
    company_name = company.name if company and hasattr(company, 'name') else "[Company Name]"
    
    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    run = p2.add_run(company_name)
    run.font.bold = True
    p2.add_run(
        ", a corporation/company duly registered and organized "
        "under the laws and regulations of the government located at "
    )
    p2.add_run("_" * 50)
    p2.add_run("\nrepresented by its President or HR Manager ")
    p2.add_run("_" * 50)
    p2.add_run(" referred to as the ")
    run = p2.add_run("SECOND PARTY")
    run.font.bold = True
    p2.add_run(".")
    
    doc.add_paragraph()
    doc.add_paragraph()
    
    # WHEREAS clauses
    whereas1 = doc.add_paragraph()
    whereas1.add_run("    1. WHEREAS, the students of the FIRST PARTY need to comply with the curriculum\n")
    whereas1.add_run("       requirements of On-the-Job Training/Internship subject;")
    
    doc.add_paragraph()
    
    whereas2 = doc.add_paragraph()
    whereas2.add_run("    2. WHEREAS, the SECOND PARTY is willing to accept the students of the FIRST PARTY\n")
    whereas2.add_run("       and would like to comply with the curriculum requirements as needed;")
    
    doc.add_paragraph()
    
    whereas3 = doc.add_paragraph()
    whereas3.add_run("    3. WHEREAS, it is agreed that there will be no employee – employer relationship between\n")
    whereas3.add_run("       the students of the FIRST PARTY and the SECOND PARTY;")
    
    doc.add_paragraph()
    
    whereas4 = doc.add_paragraph()
    whereas4.add_run("    4. WHEREAS, the Parents/Guardians of the students of the FIRST PARTY shall likewise\n")
    whereas4.add_run("       sign the agreement to comply with the terms and conditions of this agreement;")
    
    doc.add_paragraph()
    
    whereas5 = doc.add_paragraph()
    whereas5.add_run("    5. WHEREAS, it is understood that the SECOND PARTY shall not be held liable in case of\n")
    whereas5.add_run("       accident of the students of the FIRST PARTY, during the duration of the Training;")
    
    doc.add_paragraph()
    doc.add_paragraph()
    
    # Closing statement
    closing = doc.add_paragraph()
    closing.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    closing.add_run("That the above is done and signed voluntarily by all parties concerned.")
    
    doc.add_paragraph()
    doc.add_paragraph()
    
    # Signature section - FISHER VALLEY COLLEGE
    college_header = doc.add_paragraph()
    run = college_header.add_run("THE FISHER VALLEY COLLEGE")
    run.font.bold = True
    
    doc.add_paragraph()
    
    # By line
    by1 = doc.add_paragraph()
    by1.add_run("By                                                                      By")
    
    doc.add_paragraph()
    
    # Names and titles - First Party
    prof1 = doc.add_paragraph()
    run = prof1.add_run("Prof. Marlon B. Raquel")
    run.font.bold = True
    prof1.add_run("\nCBAA Chairperson" + " " * 60 + "President/HR Manager")
    
    doc.add_paragraph()
    
    prof2 = doc.add_paragraph()
    run = prof2.add_run("Mrs. Ma. Moni Kathleen L. Osorio")
    run.font.bold = True
    prof2.add_run("\nActing College Director/College Registrar" + " " * 40 + "With my Conformity:")
    
    doc.add_paragraph()
    
    # Attested by
    attested = doc.add_paragraph()
    attested.add_run("Attested by:")
    
    doc.add_paragraph()
    
    # Board member
    board = doc.add_paragraph()
    run = board.add_run("Atty. Ronald R. Yap")
    run.font.bold = True
    board.add_run("\nPresident/Chairman of the Board" + " " * 50 + "Parent/Guardian")
    
    doc.add_paragraph()
    doc.add_paragraph()
    
    # Notary section
    notary = doc.add_paragraph()
    notary.add_run("SUBSCRIBED AND SWORN to before me on this _____ day of __________ 2017, affiant\n")
    notary.add_run("exhibited to me his/her Community Tax Certificate ________________ issued on\n")
    notary.add_run("______________ at _______________.")
    
    doc.add_paragraph()
    doc.add_paragraph()
    
    # Notary Public
    notary_pub = doc.add_paragraph()
    notary_pub.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = notary_pub.add_run("NOTARY PUBLIC")
    run.font.bold = True
    
    # Doc details
    doc_details = doc.add_paragraph()
    doc_details.add_run("Doc. No. __________\n")
    doc_details.add_run("Page No. __________\n")
    doc_details.add_run("Book No. __________\n")
    doc_details.add_run("Series of __________")
    
    return doc
