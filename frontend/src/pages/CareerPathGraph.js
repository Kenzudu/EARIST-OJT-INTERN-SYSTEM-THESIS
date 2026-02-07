import React, { useMemo, useState } from 'react';
import { Rocket, GraduationCap, Banknote, Sparkles, X, Briefcase, BookOpen, Lightbulb, Zap } from 'lucide-react';

const CareerPathGraph = ({ profile, paths }) => {
    const [hoveredNode, setHoveredNode] = useState(null);
    const [selectedCareer, setSelectedCareer] = useState(null);

    // Configuration
    const padding = 80;
    const width = 1100;
    const height = 1000;
    const centerX = width / 2;
    const centerY = height / 2;
    const centerRadius = 50;
    const attributeRadius = 190;
    const careerRadius = 380;

    // State for career info loading
    const [careerInfo, setCareerInfo] = useState(null);
    const [loadingInfo, setLoadingInfo] = useState(false);

    // Function to fetch AI-generated career information
    const fetchCareerInfo = async (careerTitle) => {
        setLoadingInfo(true);
        try {
            const token = localStorage.getItem('token');
            const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

            // Extract clean role name for better AI search
            const roleName = careerTitle.split('-')[0].trim();
            const userCourse = profile.course || 'a student';

            const response = await fetch(`${baseURL}/recommendations/analyze-text/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({
                    text: `Context: The user is a student studying ${userCourse} in the Philippines.
Task: Provide detailed career information for the role: "${roleName}".
Requirements:
1) A brief description (2-3 sentences).
2) 5 key required skills.
3) Typical education requirements.
4) Average monthly or annual salary range in Philippine Peso (PHP) specifically for the Philippines market.`,
                    model: 'models/gemini-2.5-flash',
                    include_profile: false
                })
            });

            const data = await response.json();

            // Check if backend returned a mock response (error) or real analysis
            if (data.analysis && !data.mock) {
                // Parse real AI response
                const info = parseAICareerInfo(data.analysis, careerTitle);
                setCareerInfo(info);
            } else {
                // Fallback to basic info if AI failed or used mock
                console.warn('AI unavailable, using fallback:', data.error);
                setCareerInfo(getBasicCareerInfo(careerTitle));
            }
        } catch (error) {
            console.error('Error fetching career info:', error);
            setCareerInfo(getBasicCareerInfo(careerTitle));
        } finally {
            setLoadingInfo(false);
        }
    };

    // Parse AI response into structured format
    const parseAICareerInfo = (aiText, careerTitle) => {
        const role = careerTitle.split('-')[0].trim();

        // Default structure
        let info = {
            title: role,
            originalTitle: role,
            description: '',
            skills: [],
            education: '',
            salary: '',
            aiGenerated: true
        };

        try {
            // Simple parsing based on the numbered list requested in prompt
            // 1) Description, 2) Skills, 3) Education, 4) Salary
            const descriptionMatch = aiText.match(/1\)\s*([\s\S]*?)(?=2\)|$)/);
            const skillsMatch = aiText.match(/2\)\s*([\s\S]*?)(?=3\)|$)/);
            const educationMatch = aiText.match(/3\)\s*([\s\S]*?)(?=4\)|$)/);
            const salaryMatch = aiText.match(/4\)\s*([\s\S]*?)(?=$)/);

            if (descriptionMatch) info.description = descriptionMatch[1].trim();

            if (skillsMatch) {
                // Split by bullets, commas, or newlines and clean up
                const rawSkills = skillsMatch[1].trim();
                info.skills = rawSkills.split(/[,•\n]+/)
                    .map(s => s.trim())
                    .filter(s => s.length > 2 && !s.toLowerCase().includes('key skills'));
                // Limit to 6 skills
                if (info.skills.length > 6) info.skills = info.skills.slice(0, 6);
            }

            if (educationMatch) info.education = educationMatch[1].trim();
            if (salaryMatch) info.salary = salaryMatch[1].trim();

            // If parsing failed significantly, fall back to simple text
            if (!info.description) info.description = aiText.substring(0, 300) + '...';

        } catch (e) {
            console.error('Error parsing AI career info:', e);
            info.description = aiText;
        }

        return info;
    };

    // Basic fallback info
    const getBasicCareerInfo = (careerTitle) => {
        const role = careerTitle.split('-')[0].trim();
        const lowerRole = role.toLowerCase();

        // Static data for common roles as backup
        const staticData = {
            'frontend': {
                description: 'Frontend Developers build the visible parts of websites and apps efficiently.',
                skills: ['React.js', 'CSS/Tailwind', 'JavaScript', 'Responsive Design', 'Git'],
                salary: 'PHP 30,000 - PHP 80,000 per month',
                education: 'BS Computer Science / IT'
            },
            'backend': {
                description: 'Backend Developers manage servers, databases, and application logic.',
                skills: ['Node.js/Python', 'SQL/NoSQL', 'API Design', 'Server Management', 'Security'],
                salary: 'PHP 40,000 - PHP 90,000 per month',
                education: 'BS Computer Science / IT'
            },
            'data': {
                description: 'Data professionals analyze data to help organizations make better decisions.',
                skills: ['Python', 'SQL', 'Data Analysis', 'Machine Learning', 'Statistics'],
                salary: 'PHP 50,000 - PHP 110,000 per month',
                education: 'BS CS / Math / Statistics'
            },
            'cloud': {
                description: 'Cloud professionals design and maintain cloud infrastructure and services.',
                skills: ['AWS/Azure', 'Linux', 'Networking', 'Security', 'Docker'],
                salary: 'PHP 60,000 - PHP 130,000 per month',
                education: 'BS CS / IT + Certifications'
            }
        };

        const userCourse = profile.course || 'Relevant Degree';

        let data = {
            title: role,
            description: `${role} is a professional career path that involves applying specialized skills to solve problems.`,
            skills: ['Specialized Skills', 'Problem Solving', 'Communication'],
            education: userCourse,
            salary: 'Varies by experience',
            aiGenerated: false
        };

        // Match static data if available
        for (const [key, info] of Object.entries(staticData)) {
            if (lowerRole.includes(key)) {
                data = { ...data, ...info };
                break;
            }
        }

        return data;
    };

    // Handle career node click
    const handleCareerClick = (careerLabel) => {
        setSelectedCareer(careerLabel);
        fetchCareerInfo(careerLabel);
    };

    // Process data to create nodes and links
    const { nodes, links } = useMemo(() => {
        if (!process.env.REACT_APP_DISABLE_GRAPH_MEMO) {
            // Keep existing logic
        }
        const nodes = [];
        const links = [];

        // 1. Center Node (User)
        nodes.push({
            id: 'root',
            label: 'You',
            type: 'root',
            x: centerX,
            y: centerY,
            r: centerRadius,
            color: '#6366f1',
            gradient: ['#8b5cf6', '#6366f1']
        });

        // 2. Attribute Nodes (Skills, Interests, Course)
        let attributes = [];

        // Add Course
        if (profile.course) {
            const courseLabel = profile.course.length > 25
                ? profile.course.substring(0, 25) + '...'
                : profile.course;
            attributes.push({ type: 'course', label: courseLabel, fullLabel: profile.course });
        }

        // Add Top 5 Skills
        if (profile.skills) {
            const skills = profile.skills.split(',').map(s => s.trim()).slice(0, 5);
            skills.forEach(skill => attributes.push({ type: 'skill', label: skill }));
        }

        // Add Top 3 Interests
        if (profile.career_interests) {
            const interests = profile.career_interests.split(',').map(s => s.trim()).slice(0, 3);
            interests.forEach(interest => attributes.push({ type: 'interest', label: interest }));
        }

        // Distribute attributes in inner circle
        const attrAngleStep = (2 * Math.PI) / Math.max(attributes.length, 1);
        attributes.forEach((attr, i) => {
            const angle = i * attrAngleStep - Math.PI / 2;
            const x = centerX + attributeRadius * Math.cos(angle);
            const y = centerY + attributeRadius * Math.sin(angle);

            const node = {
                id: `attr-${i}`,
                ...attr,
                x,
                y,
                r: 35,
                color: attr.type === 'course' ? '#f59e0b' : attr.type === 'skill' ? '#10b981' : '#06b6d4',
                gradient: attr.type === 'course'
                    ? ['#fbbf24', '#f59e0b']
                    : attr.type === 'skill'
                        ? ['#34d399', '#10b981']
                        : ['#22d3ee', '#06b6d4']
            };
            nodes.push(node);

            // Link to root with animated gradient
            links.push({
                source: 'root',
                target: node.id,
                color: 'url(#linkGradient)',
                width: 2.5,
                animated: true
            });
        });

        // 3. Career Path Nodes (Outer Circle)
        if (paths && paths.length > 0) {
            const careerAngleStep = (2 * Math.PI) / paths.length;
            paths.forEach((path, i) => {
                const angle = i * careerAngleStep - Math.PI / 2 + (careerAngleStep / 2);
                const x = centerX + careerRadius * Math.cos(angle);
                const y = centerY + careerRadius * Math.sin(angle);

                const node = {
                    id: `career-${i}`,
                    label: path,
                    type: 'career',
                    x,
                    y,
                    r: 45,
                    color: '#ef4444',
                    gradient: ['#f87171', '#ef4444']
                };
                nodes.push(node);
                // Create connections to relevant attributes
                let connected = false;
                const connections = [];

                // Try to find text matches
                attributes.forEach((attr, attrIdx) => {
                    const attrText = (attr.fullLabel || attr.label).toLowerCase();
                    const pathText = path.toLowerCase();
                    const attrWords = attrText.split(/[\s,]+/).filter(w => w.length > 2);
                    const pathWords = pathText.split(/[\s,]+/).filter(w => w.length > 2);

                    // Check for word overlap
                    const hasMatch = attrWords.some(w => pathWords.some(pw =>
                        pw.includes(w) || w.includes(pw) ||
                        // Check for common career-related keywords
                        (attr.type === 'course' && (
                            pathText.includes('engineer') ||
                            pathText.includes('developer') ||
                            pathText.includes('analyst') ||
                            pathText.includes('manager')
                        ))
                    ));

                    if (hasMatch) {
                        connections.push({
                            source: `attr-${attrIdx}`,
                            target: node.id,
                            color: 'rgba(239, 68, 68, 0.4)',
                            width: 2.5,
                            animated: false
                        });
                        connected = true;
                    }
                });

                // If connected, add all connections
                if (connected) {
                    connections.forEach(conn => links.push(conn));
                } else {
                    // If no semantic match, connect to course (if exists) and nearest attribute
                    const courseIdx = attributes.findIndex(a => a.type === 'course');
                    if (courseIdx !== -1) {
                        links.push({
                            source: `attr-${courseIdx}`,
                            target: node.id,
                            color: 'rgba(245, 158, 11, 0.3)',
                            width: 2,
                            animated: false
                        });
                    }

                    // Also connect to nearest skill or interest
                    const nearestIdx = Math.floor(i * attributes.length / paths.length) % attributes.length;
                    if (nearestIdx !== courseIdx) {
                        links.push({
                            source: `attr-${nearestIdx}`,
                            target: node.id,
                            color: 'rgba(200, 200, 200, 0.2)',
                            width: 1.5,
                            animated: false
                        });
                    }
                }
            });
        }

        return { nodes, links };
    }, [profile, paths]);

    return (
        <div className="career-graph-container" style={{
            width: '100%',
            overflowX: 'auto',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            padding: '30px',
            marginBottom: '30px',
            position: 'relative'
        }}>
            <div style={{
                textAlign: 'center',
                marginBottom: '20px',
                color: 'white'
            }}>
                <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: '1.8rem',
                    fontWeight: '700',
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px'
                }}>
                    <Rocket size={28} strokeWidth={2.5} />
                    Your Career Journey
                </h3>
                <p style={{
                    margin: 0,
                    fontSize: '1rem',
                    opacity: 0.9,
                    fontWeight: '400'
                }}>
                    Discover connections between your skills and future opportunities
                </p>
            </div>

            <svg
                width={width + padding * 2}
                height={height + padding * 2}
                viewBox={`${-padding} ${-padding} ${width + padding * 2} ${height + padding * 2}`}
                style={{
                    maxWidth: '100%',
                    height: 'auto',
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
            >
                <defs>
                    {/* Gradients */}
                    <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
                    </linearGradient>

                    {nodes.map(node => (
                        <radialGradient key={`grad-${node.id}`} id={`gradient-${node.id}`}>
                            <stop offset="0%" stopColor={node.gradient ? node.gradient[0] : node.color} />
                            <stop offset="100%" stopColor={node.gradient ? node.gradient[1] : node.color} />
                        </radialGradient>
                    ))}

                    {/* Glow filter */}
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    <style>
                        {`
                            @keyframes dash {
                                to {
                                    stroke-dashoffset: -20;
                                }
                            }
                            .animated-link {
                                stroke-dasharray: 5, 5;
                                animation: dash 1s linear infinite;
                            }
                            .node-circle {
                                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                            }
                            .node-circle:hover {
                                filter: brightness(1.2) drop-shadow(0 0 8px currentColor);
                                transform: scale(1.1);
                            }
                        `}
                    </style>
                </defs>

                {/* Background circles for depth */}
                <circle cx={centerX} cy={centerY} r={careerRadius + 20} fill="none" stroke="#f0f0f0" strokeWidth="1" opacity="0.3" />
                <circle cx={centerX} cy={centerY} r={attributeRadius + 10} fill="none" stroke="#e0e0e0" strokeWidth="1" opacity="0.3" />

                {/* Links */}
                {links.map((link, i) => {
                    const source = nodes.find(n => n.id === link.source);
                    const target = nodes.find(n => n.id === link.target);
                    if (!source || !target) return null;

                    return (
                        <line
                            key={`link-${i}`}
                            x1={source.x}
                            y1={source.y}
                            x2={target.x}
                            y2={target.y}
                            stroke={link.color}
                            strokeWidth={link.width}
                            strokeLinecap="round"
                            className={link.animated ? 'animated-link' : ''}
                            opacity={hoveredNode && (hoveredNode === link.source || hoveredNode === link.target) ? 1 : 0.6}
                        />
                    );
                })}

                {/* Nodes */}
                {nodes.map((node) => (
                    <g
                        key={node.id}
                        transform={`translate(${node.x}, ${node.y})`}
                        onMouseEnter={() => setHoveredNode(node.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                        onClick={() => node.type === 'career' && handleCareerClick(node.label)}
                        style={{ cursor: node.type === 'career' ? 'pointer' : 'default' }}
                    >
                        {/* Outer glow ring on hover */}
                        {hoveredNode === node.id && (
                            <circle
                                r={node.r + 8}
                                fill="none"
                                stroke={node.color}
                                strokeWidth="2"
                                opacity="0.3"
                            >
                                <animate
                                    attributeName="r"
                                    from={node.r + 5}
                                    to={node.r + 15}
                                    dur="1.5s"
                                    repeatCount="indefinite"
                                />
                                <animate
                                    attributeName="opacity"
                                    from="0.5"
                                    to="0"
                                    dur="1.5s"
                                    repeatCount="indefinite"
                                />
                            </circle>
                        )}

                        {/* Node Circle */}
                        <circle
                            className="node-circle"
                            r={hoveredNode === node.id ? node.r + 3 : node.r}
                            fill={`url(#gradient-${node.id})`}
                            stroke="#fff"
                            strokeWidth="4"
                            filter="url(#glow)"
                        >
                            <title>{node.fullLabel || node.label}</title>
                        </circle>

                        {/* Icon - Inline SVG */}
                        <g transform="scale(0.8)">
                            {node.type === 'root' && (
                                <path
                                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                                    fill="#fff"
                                    transform="translate(-12, -12)"
                                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                                />
                            )}
                            {node.type === 'course' && (
                                <path
                                    d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"
                                    fill="#fff"
                                    transform="translate(-12, -12)"
                                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                                />
                            )}
                            {node.type === 'skill' && (
                                <path
                                    d="M7 2v11h3v9l7-12h-4l4-8z"
                                    fill="#fff"
                                    transform="translate(-12, -12)"
                                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                                />
                            )}
                            {node.type === 'interest' && (
                                <path
                                    d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"
                                    fill="#fff"
                                    transform="translate(-12, -12)"
                                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                                />
                            )}
                            {node.type === 'career' && (
                                <path
                                    d="M9.19 6.35c-2.04 2.29-3.44 5.58-3.57 5.89L2 10.69l4.05-4.05c.47-.47 1.15-.68 1.81-.55l1.33.89M11.17 17s3.74-1.55 5.89-3.7c5.4-5.4 4.5-9.62 4.21-10.57-.95-.3-5.17-1.19-10.57 4.21C8.55 9.09 7 12.83 7 12.83L11.17 17M17.65 14.81c-2.29 2.04-5.58 3.44-5.89 3.57L13.31 22l4.05-4.05c.47-.47.68-1.15.55-1.81l-.89-1.33M9 18c0 .83-.34 1.58-.88 2.12C6.94 21.3 2 22 2 22s.7-4.94 1.88-6.12C4.42 15.34 5.17 15 6 15c1.66 0 3 1.34 3 3z"
                                    fill="#fff"
                                    transform="translate(-12, -12)"
                                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                                />
                            )}
                        </g>

                        {/* External Label */}
                        {node.type !== 'root' && (
                            <foreignObject
                                x={-85}
                                y={node.r + 10}
                                width={170}
                                height={70}
                                style={{ overflow: 'visible' }}
                            >
                                <div style={{
                                    textAlign: 'center',
                                    fontSize: node.type === 'career' ? '13px' : '14px',
                                    color: '#1f2937',
                                    fontWeight: '700',
                                    backgroundColor: hoveredNode === node.id ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.85)',
                                    padding: '6px 8px',
                                    borderRadius: '8px',
                                    lineHeight: '1.4',
                                    boxShadow: hoveredNode === node.id ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.1)',
                                    border: `2px solid ${node.color}`,
                                    transition: 'all 0.3s ease',
                                    transform: hoveredNode === node.id ? 'scale(1.05)' : 'scale(1)'
                                }}>
                                    {node.label}
                                </div>
                            </foreignObject>
                        )}

                        {/* Root label inside circle */}
                        {node.type === 'root' && (
                            <text
                                dy={28}
                                textAnchor="middle"
                                fill="#fff"
                                fontSize="18px"
                                fontWeight="bold"
                                pointerEvents="none"
                                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                            >
                                {node.label}
                            </text>
                        )}
                    </g>
                ))}
            </svg>

            {/* Legend */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '24px',
                marginTop: '20px',
                fontSize: '13px',
                flexWrap: 'wrap',
                color: 'white'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', fontWeight: '600' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    You
                </div>
                {/* ... other legend items ... */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', fontWeight: '600' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                        <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
                    </svg>
                    course
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', fontWeight: '600' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                        <path d="M7 2v11h3v9l7-12h-4l4-8z" />
                    </svg>
                    Skills
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', fontWeight: '600' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                        <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
                    </svg>
                    Interests
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', fontWeight: '600' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                        <path d="M9.19 6.35c-2.04 2.29-3.44 5.58-3.57 5.89L2 10.69l4.05-4.05c.47-.47 1.15-.68 1.81-.55l1.33.89M11.17 17s3.74-1.55 5.89-3.7c5.4-5.4 4.5-9.62 4.21-10.57-.95-.3-5.17-1.19-10.57 4.21C8.55 9.09 7 12.83 7 12.83L11.17 17M17.65 14.81c-2.29 2.04-5.58 3.44-5.89 3.57L13.31 22l4.05-4.05c.47-.47.68-1.15.55-1.81l-.89-1.33M9 18c0 .83-.34 1.58-.88 2.12C6.94 21.3 2 22 2 22s.7-4.94 1.88-6.12C4.42 15.34 5.17 15 6 15c1.66 0 3 1.34 3 3z" />
                    </svg>
                    Career Paths
                </div>
            </div>

            {/* Career Info Modal */}
            {selectedCareer && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '20px'
                    }}
                    onClick={() => setSelectedCareer(null)}
                >
                    <div
                        style={{
                            backgroundColor: '#fff',
                            borderRadius: '24px',
                            maxWidth: '550px',
                            width: '100%',
                            maxHeight: '85vh',
                            overflow: 'auto',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            animation: 'slideUp 0.3s ease-out'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <style>{`
                            @keyframes slideUp {
                                from { transform: translateY(20px); opacity: 0; }
                                to { transform: translateY(0); opacity: 1; }
                            }
                        `}</style>

                        {/* Content */}
                        {loadingInfo ? (
                            <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <div className="loading-spinner" style={{
                                    width: '40px',
                                    height: '40px',
                                    border: '3px solid #f3f3f3',
                                    borderTop: '3px solid #6366f1',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite',
                                    marginBottom: '16px'
                                }}></div>
                                <p style={{ color: '#6b7280', fontSize: '15px' }}>Analyzing career details...</p>
                                <style>{`
                                    @keyframes spin {
                                        0% { transform: rotate(0deg); }
                                        100% { transform: rotate(360deg); }
                                    }
                                `}</style>
                            </div>
                        ) : careerInfo ? (
                            <div style={{ padding: '32px' }}>
                                {/* Header */}
                                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h2 style={{ margin: '0 0 6px 0', color: '#111827', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>
                                            {careerInfo.title}
                                        </h2>
                                        {careerInfo.aiGenerated && (
                                            <span style={{
                                                fontSize: '12px',
                                                color: '#6366f1',
                                                fontWeight: '600',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                backgroundColor: '#e0e7ff',
                                                padding: '4px 10px',
                                                borderRadius: '20px'
                                            }}>
                                                <Sparkles size={14} fill="#6366f1" />
                                                AI Analyzed
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setSelectedCareer(null)}
                                        style={{
                                            background: '#f3f4f6',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '36px',
                                            height: '36px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            color: '#4b5563',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={e => e.target.style.background = '#e5e7eb'}
                                        onMouseLeave={e => e.target.style.background = '#f3f4f6'}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Description */}
                                <div style={{ marginBottom: '32px' }}>
                                    <p style={{ margin: 0, color: '#4b5563', fontSize: '16px', lineHeight: '1.6' }}>
                                        {careerInfo.description}
                                    </p>
                                </div>

                                {/* Skills Grid */}
                                {careerInfo.skills && careerInfo.skills.length > 0 && (
                                    <div style={{ marginBottom: '32px' }}>
                                        <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '1px', fontWeight: '700' }}>
                                            Required Skills
                                        </h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {careerInfo.skills.map((skill, idx) => (
                                                <span key={idx} style={{
                                                    backgroundColor: '#f3f4f6',
                                                    color: '#374151',
                                                    padding: '8px 16px',
                                                    borderRadius: '12px',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                    border: '1px solid #e5e7eb'
                                                }}>
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Info Grid for Education & Salary */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '20px',
                                    padding: '24px',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '20px',
                                    border: '1px solid #f3f4f6'
                                }}>
                                    {/* Education */}
                                    {careerInfo.education && (
                                        <div style={{ paddingRight: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <GraduationCap size={20} color="#6b7280" />
                                                <h4 style={{ margin: 0, fontSize: '14px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    Education
                                                </h4>
                                            </div>
                                            <p style={{ margin: 0, color: '#111827', fontSize: '15px', fontWeight: '500', lineHeight: '1.4' }}>
                                                {careerInfo.education}
                                            </p>
                                        </div>
                                    )}

                                    {/* Salary Range */}
                                    {careerInfo.salary && (
                                        <div style={{ paddingLeft: '20px', borderLeft: '1px solid #e5e7eb' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <Banknote size={20} color="#059669" />
                                                <h4 style={{ margin: 0, fontSize: '14px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    Est. Salary
                                                </h4>
                                            </div>
                                            <p style={{ margin: 0, color: '#059669', fontSize: '15px', fontWeight: '700' }}>
                                                {careerInfo.salary}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CareerPathGraph;
