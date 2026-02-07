import re

def add_attachment_to_messages(filepath, api_endpoint):
    """Add attachment functionality to a messages component"""
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Add chatAttachment state
    content = re.sub(
        r"(const \[chatInput, setChatInput\] = useState\(''\);)\s*\n\s*(const \[sendingChat, setSendingChat\] = useState\(false\);)",
        r"\1\n    const [chatAttachment, setChatAttachment] = useState(null);\n    \2",
        content
    )
    
    # 2. Update handleSendChatMessage function
    old_handler = r"const handleSendChatMessage = async \(e\) => \{[^}]+if \(!chatInput\.trim\(\) \|\| !chatUser\) return;[^}]+const messageText = chatInput\.trim\(\);[^}]+try \{[^}]+setSendingChat\(true\);[^}]+const token = localStorage\.getItem\('token'\);[^}]+const formData = new FormData\(\);[^}]+formData\.append\('recipient_id', chatUser\.id\);[^}]+formData\.append\('subject', 'Chat Message'\);[^}]+formData\.append\('message', messageText\);[^}]+// Clear input immediately for better UX[^}]+setChatInput\(''\);[^}]+const response = await axios\.post\(`\$\{baseURL\}" + api_endpoint + r"/messages/`, formData, \{[^}]+headers: \{[^}]+Authorization: `Token \$\{token\}`,[\s\S]+?attachment: null"
    
    new_handler = f"""const handleSendChatMessage = async (e) => {{
        e.preventDefault();

        if ((!chatInput.trim() && !chatAttachment) || !chatUser) return;

        const messageText = chatInput.trim() || '(Attachment)';
        const attachment = chatAttachment;

        try {{
            setSendingChat(true);
            const token = localStorage.getItem('token');

            const formData = new FormData();
            formData.append('recipient_id', chatUser.id);
            formData.append('subject', 'Chat Message');
            formData.append('message', messageText);
            if (attachment) {{
                formData.append('attachment', attachment);
            }}

            // Clear input and attachment immediately for better UX
            setChatInput('');
            setChatAttachment(null);

            const response = await axios.post(`${{baseURL}}{api_endpoint}/messages/`, formData, {{
                headers: {{
                    Authorization: `Token ${{token}}`,
                    'Content-Type': 'multipart/form-data'
                }}
            }});

            // Create the new message object to add to chat immediately
            const newMessage = {{
                id: response.data.id,
                type: 'sent',
                sender: localStorage.getItem('username'),
                sender_name: `${{localStorage.getItem('first_name')}} ${{localStorage.getItem('last_name')}}`,
                recipient: chatUser.username,
                recipient_name: chatUser.name,
                subject: 'Chat Message',
                message: messageText,
                created_at: new Date().toISOString(),
                is_read: false,
                attachment: response.data.attachment || null"""
    
    content = re.sub(old_handler, new_handler, content, flags=re.DOTALL)
    
    # Also update the error handler to restore attachment
    content = re.sub(
        r"(// Restore the input if sending failed\s+setChatInput\(messageText\);)",
        r"\1\n            setChatAttachment(attachment);",
        content
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Updated {filepath}")

# Apply to all three files
files = [
    ('c:/Users/Kenzu/Desktop/Earist OJT/frontend/src/pages/SupervisorMessages.js', 'supervisor'),
    ('c:/Users/Kenzu/Desktop/Earist OJT/frontend/src/pages/AdminMessages.js', 'admin'),
    ('c:/Users/Kenzu/Desktop/Earist OJT/frontend/src/pages/StudentMessages.js', 'student')
]

for filepath, endpoint in files:
    try:
        add_attachment_to_messages(filepath, endpoint)
    except Exception as e:
        print(f"Error updating {filepath}: {e}")

print("Done!")
