-- Testimonial Seed Script
-- This script creates seed data for testimonials and related entities
-- Usage: Run this against your local or production database

-- Variables for workspace_id (replace with your actual UUID)
DO $$
DECLARE
    workspace_id UUID := 'a6569f79-3acc-4a32-80bb-938cd873b354'; -- Replace with your actual workspace UUID
BEGIN

-- 1. Create Customer Profiles
INSERT INTO customer_profiles (id, workspace_id, email, name, title, company, industry, location, avatar_url, social_profiles, custom_fields)
VALUES
    ('10000000-0000-0000-0000-000000000001', workspace_id, 'sarah.johnson@example.com', 'Sarah Johnson', 'Marketing Director', 'Innovate Tech', 'Technology', 'San Francisco, CA', 'https://randomuser.me/api/portraits/women/1.jpg', 
        '{"linkedin": "linkedin.com/in/sarahjohnson", "twitter": "@sarahjmarketing"}', 
        '{"customer_since": "2021-03-15", "annual_spend": "$75,000"}'
    ),
    ('10000000-0000-0000-0000-000000000002', workspace_id, 'michael.chen@example.com', 'Michael Chen', 'CEO', 'GrowFast Solutions', 'Business Services', 'New York, NY', 'https://randomuser.me/api/portraits/men/2.jpg', 
        '{"linkedin": "linkedin.com/in/michaelchen"}', 
        '{"customer_since": "2020-07-22", "annual_spend": "$125,000"}'
    ),
    ('10000000-0000-0000-0000-000000000003', workspace_id, 'emma.rodriguez@example.com', 'Emma Rodriguez', 'Operations Manager', 'Sunshine Retail', 'Retail', 'Miami, FL', 'https://randomuser.me/api/portraits/women/3.jpg', 
        '{"linkedin": "linkedin.com/in/emmar", "instagram": "@emmaoperations"}', 
        '{"customer_since": "2022-01-10", "annual_spend": "$42,000"}'
    ),
    ('10000000-0000-0000-0000-000000000004', workspace_id, 'james.patel@example.com', 'James Patel', 'CTO', 'Quantum Computing', 'Technology', 'Austin, TX', 'https://randomuser.me/api/portraits/men/4.jpg', 
        '{"linkedin": "linkedin.com/in/jamespatel", "github": "github.com/jpatel"}', 
        '{"customer_since": "2019-11-05", "annual_spend": "$250,000"}'
    ),
    ('10000000-0000-0000-0000-000000000005', workspace_id, 'olivia.kim@example.com', 'Olivia Kim', 'Product Manager', 'Urban Lifestyle', 'Consumer Goods', 'Seattle, WA', 'https://randomuser.me/api/portraits/women/5.jpg', 
        '{"linkedin": "linkedin.com/in/oliviakim", "twitter": "@livkim"}', 
        '{"customer_since": "2022-05-18", "annual_spend": "$65,000"}'
    ),
    ('10000000-0000-0000-0000-000000000006', workspace_id, 'robert.jackson@example.com', 'Robert Jackson', 'VP of Sales', 'Financial Solutions Inc.', 'Finance', 'Chicago, IL', 'https://randomuser.me/api/portraits/men/6.jpg', 
        '{"linkedin": "linkedin.com/in/robertjackson"}', 
        '{"customer_since": "2020-02-28", "annual_spend": "$180,000"}'
    ),
    ('10000000-0000-0000-0000-000000000007', workspace_id, 'sophia.garcia@example.com', 'Sophia Garcia', 'Customer Success Lead', 'CloudConnect', 'SaaS', 'Denver, CO', 'https://randomuser.me/api/portraits/women/7.jpg', 
        '{"linkedin": "linkedin.com/in/sophiagarcia", "twitter": "@sophiasuccess"}', 
        '{"customer_since": "2021-09-03", "annual_spend": "$95,000"}'
    ),
    ('10000000-0000-0000-0000-000000000008', workspace_id, 'william.nguyen@example.com', 'William Nguyen', 'Digital Marketing Manager', 'EcoFriendly Products', 'Sustainability', 'Portland, OR', 'https://randomuser.me/api/portraits/men/8.jpg', 
        '{"linkedin": "linkedin.com/in/williamnguyen", "instagram": "@willnguyen"}', 
        '{"customer_since": "2022-03-15", "annual_spend": "$58,000"}'
    ),
    ('10000000-0000-0000-0000-000000000009', workspace_id, 'ava.smith@example.com', 'Ava Smith', 'Director of Engineering', 'Innovative Health', 'Healthcare', 'Boston, MA', 'https://randomuser.me/api/portraits/women/9.jpg', 
        '{"linkedin": "linkedin.com/in/avasmith", "github": "github.com/asmith"}', 
        '{"customer_since": "2020-10-11", "annual_spend": "$210,000"}'
    ),
    ('10000000-0000-0000-0000-000000000010', workspace_id, 'david.wilson@example.com', 'David Wilson', 'CFO', 'Sustainable Energy Co.', 'Energy', 'Los Angeles, CA', 'https://randomuser.me/api/portraits/men/10.jpg', 
        '{"linkedin": "linkedin.com/in/davidwilson"}', 
        '{"customer_since": "2019-05-20", "annual_spend": "$320,000"}'
    );

-- 2. Create Testimonials
INSERT INTO testimonials (
    id, workspace_id, customer_profile_id, testimonial_type, format, status, language,
    title, summary, content, rating, collection_method, verification_method,
    published, tags, categories, created_at
)
VALUES
    (
        '20000000-0000-0000-0000-000000000001',
        workspace_id,
        '10000000-0000-0000-0000-000000000001',
        'customer',
        'text',
        'approved',
        'en',
        'Streamlined Our Marketing Operations',
        'Sarah shares how our platform helped her team save 20 hours per week on marketing operations.',
        'We''ve been using this platform for over a year now, and it has completely transformed how we manage our marketing operations. The automation features alone have saved my team around 20 hours per week, allowing us to focus on strategy rather than repetitive tasks. The analytics dashboard gives us insights we never had before, which has helped us improve our campaign ROI by approximately 35%. The customer support team has been incredibly responsive whenever we''ve had questions. I highly recommend this solution to any marketing team looking to scale their efforts efficiently.',
        5,
        'social_import',
        'email',
        TRUE,
        ARRAY['marketing', 'automation', 'time-saving'],
        ARRAY['success story', 'enterprise'],
        '2023-02-15T14:30:00Z'
    ),
    (
        '20000000-0000-0000-0000-000000000002',
        workspace_id,
        '10000000-0000-0000-0000-000000000002',
        'customer',
        'video',
        'approved',
        'en',
        'Doubled Our Growth Rate in Six Months',
        'Michael discusses how implementing our solution helped his company achieve unprecedented growth.',
        'As the CEO of a rapidly growing company, I needed a solution that could scale with us without adding administrative overhead. This platform delivered exactly that. Within six months of implementation, we saw our growth rate double from 15% to 30% quarter-over-quarter. The onboarding process was smooth, and the workflow integrations meant we didn''t have to change how our teams operate. What impressed me most was how the platform adapted to our unique business model instead of forcing us to change our processes. The ROI has been clear and substantial.',
        5,
        'social_import',
        'domain_verification',
        TRUE,
        ARRAY['growth', 'scalability', 'integration'],
        ARRAY['case study', 'enterprise'],
        '2023-05-20T09:15:00Z'
    ),
    (
        '20000000-0000-0000-0000-000000000003',
        workspace_id,
        '10000000-0000-0000-0000-000000000003',
        'customer',
        'text',
        'approved',
        'en',
        'Improved Inventory Management Efficiency',
        'Emma explains how our retail solution helped streamline operations and reduce stockouts.',
        'Managing inventory across multiple retail locations was a constant challenge for us until we implemented this system. The real-time inventory tracking has reduced our stockouts by 78%, and the automated reordering system has saved countless hours of manual work. Our staff found the interface intuitive, which meant minimal training time. The mobile app has been particularly useful for our floor managers who can now check stock levels while helping customers. There''s room for improvement in the reporting features, but overall, this has been a game-changer for our operations.',
        4,
        'social_import',
        'order_verification',
        TRUE,
        ARRAY['retail', 'inventory', 'efficiency'],
        ARRAY['operational improvement', 'small business'],
        '2023-01-30T16:45:00Z'
    ),
    (
        '20000000-0000-0000-0000-000000000004',
        workspace_id,
        '10000000-0000-0000-0000-000000000004',
        'customer',
        'social_post',
        'approved',
        'en',
        'Revolutionary Development Environment',
        'James shares his technical team''s experience with our development tools.',
        'As a CTO overseeing complex technical projects, I''ve tried numerous development environments. This one stands out for its thoughtful integration of CI/CD pipelines and seamless collaboration features. My team of 30+ engineers has seen a 40% reduction in deployment issues since we switched six months ago. The built-in code quality tools have improved our overall codebase health, and the performance testing suite has caught several potential issues before they reached production. The only drawback is the learning curve for junior developers, but the comprehensive documentation helps mitigate this.',
        5,
        'social_import',
        'social_login',
        TRUE,
        ARRAY['development', 'devops', 'collaboration'],
        ARRAY['technical', 'enterprise'],
        '2023-06-10T11:20:00Z'
    ),
    (
        '20000000-0000-0000-0000-000000000005',
        workspace_id,
        '10000000-0000-0000-0000-000000000005',
        'customer',
        'text',
        'approved',
        'en',
        'Transformed Our Product Launch Process',
        'Olivia describes how our platform streamlined her product launch coordination.',
        'Coordinating product launches used to involve countless spreadsheets, emails, and status meetings. Since implementing this platform, we''ve consolidated everything into one source of truth. Our last three product launches have gone more smoothly than ever before, with all team members having visibility into their responsibilities and deadlines. The integration with our existing marketing tools means we''re not duplicating efforts. I especially appreciate the customizable workflows that allow us to adapt the system to our specific launch process rather than the other way around.',
        5,
        'interview',
        'email',
        TRUE,
        ARRAY['product management', 'launch', 'coordination'],
        ARRAY['productivity', 'mid-market'],
        '2023-03-05T13:40:00Z'
    ),
    (
        '20000000-0000-0000-0000-000000000006',
        workspace_id,
        '10000000-0000-0000-0000-000000000006',
        'customer',
        'text',
        'pending_review',
        'en',
        'Enhanced Our Sales Pipeline Visibility',
        'Robert discusses improvements in sales forecasting and team coordination.',
        'In financial services, accurate forecasting is critical. This CRM solution has given us unprecedented visibility into our sales pipeline. The AI-powered forecasting has been remarkably accurate, typically within 5% of actual results. My team of 15 sales representatives has embraced the system because it eliminates much of the administrative burden they used to face with our previous solution. The mobile experience could use some refinement, but the desktop interface is excellent. Customer support has been responsive when we''ve needed help with customization. Overall, this has been a worthwhile investment that has directly contributed to our 28% revenue growth this year.',
        4,
        'survey',
        'email',
        FALSE,
        ARRAY['sales', 'crm', 'forecasting'],
        ARRAY['financial services', 'enterprise'],
        '2023-07-12T10:30:00Z'
    ),
    (
        '20000000-0000-0000-0000-000000000007',
        workspace_id,
        '10000000-0000-0000-0000-000000000007',
        'customer',
        'video',
        'approved',
        'en',
        'Reduced Customer Churn by 45%',
        'Sophia shares strategies implemented using our customer success platform.',
        'Our SaaS business lives and dies by customer retention, which is why this customer success platform has been so valuable to us. The early warning system has allowed us to proactively address customer concerns before they become reasons to leave. In the first six months after implementation, we reduced our monthly churn rate from 4.2% to 2.3% - that''s a 45% improvement that goes straight to our bottom line. The automated customer health scoring has helped us prioritize our team''s efforts, focusing on the accounts that need attention most. The onboarding playbooks have standardized our approach, ensuring every new customer gets a consistent, high-quality experience.',
        5,
        'api',
        'employee_verification',
        TRUE,
        ARRAY['customer success', 'retention', 'saas'],
        ARRAY['success story', 'mid-market'],
        '2023-04-25T15:15:00Z'
    ),
    (
        '20000000-0000-0000-0000-000000000008',
        workspace_id,
        '10000000-0000-0000-0000-000000000008',
        'customer',
        'audio',
        'approved',
        'en',
        'Sustainable Marketing Results',
        'William explains how our platform helped align marketing with sustainability goals.',
        'As a company committed to sustainability, we needed a marketing platform that could help us reach our audience while maintaining our values. This solution has delivered on both fronts. The targeting capabilities have helped us reach consumers who prioritize eco-friendly products, increasing our qualified leads by 68%. The campaign carbon footprint calculator has been an unexpected but welcome feature, allowing us to optimize for environmental impact alongside traditional metrics. We''ve been able to reduce our digital carbon footprint while simultaneously improving campaign performance - a win-win that our stakeholders appreciate.',
        5,
        'survey',
        'email',
        TRUE,
        ARRAY['sustainability', 'digital marketing', 'targeting'],
        ARRAY['green business', 'small business'],
        '2023-02-28T08:50:00Z'
    ),
    (
        '20000000-0000-0000-0000-000000000009',
        workspace_id,
        '10000000-0000-0000-0000-000000000009',
        'customer',
        'text',
        'featured',
        'en',
        'Accelerated Healthcare Application Development',
        'Ava details how our development platform helped meet stringent healthcare requirements.',
        'Developing applications in the healthcare space comes with unique challenges around security, compliance, and reliability. This development platform has streamlined our ability to meet these requirements while still moving quickly. The pre-built HIPAA-compliant components saved us months of development time, and the automated security scanning has strengthened our overall security posture. We''ve been able to release new features 50% faster without compromising on quality or compliance. The platform''s flexibility has allowed our team to customize workflows to match our specific development methodology, which has improved team satisfaction and productivity.',
        5,
        'api',
        'domain_verification',
        TRUE,
        ARRAY['healthcare', 'development', 'compliance'],
        ARRAY['technical', 'enterprise'],
        '2023-06-05T14:10:00Z'
    ),
    (
        '20000000-0000-0000-0000-000000000010',
        workspace_id,
        '10000000-0000-0000-0000-000000000010',
        'customer',
        'text',
        'approved',
        'en',
        'Optimized Financial Operations and Reporting',
        'David shares how our financial platform improved reporting and compliance.',
        'As CFO of a growing energy company, I needed a financial system that could handle complex reporting requirements while streamlining our month-end close process. This platform has reduced our close time from 15 days to just 5, giving our management team faster access to critical financial insights. The automated compliance features have been particularly valuable as we navigate the complex regulatory environment in the energy sector. The system integrates seamlessly with our existing tools, which made the transition relatively painless. The ROI has been clear - we''ve reduced our finance team''s overtime by 70% while improving the accuracy and timeliness of our financial reporting.',
        4,
        'interview',
        'employee_verification',
        TRUE,
        ARRAY['finance', 'reporting', 'compliance'],
        ARRAY['operational improvement', 'enterprise'],
        '2023-05-15T09:30:00Z'
    );

-- 3. Create Testimonial Analyses
INSERT INTO testimonial_analyses (
    id, testimonial_id, analysis_type,
    sentiment_score, authenticity_score, emotional_score,
    narrative_score, business_value_score, credibility_score,
    analysis_data, analysis_version
)
VALUES
    (
        '30000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000001',
        'sentiment',
        0.92, 0.88, 0.85, 0.90, 0.95, 0.87,
        '{"key_emotions": ["satisfaction", "appreciation", "relief"], "positive_phrases": ["completely transformed", "incredibly responsive", "highly recommend"], "detailed_breakdown": {"praise_specificity": 0.9, "personal_voice": 0.85, "concrete_results": 0.95}}',
        '1.2.0'
    ),
    (
        '30000000-0000-0000-0000-000000000002',
        '20000000-0000-0000-0000-000000000001',
        'business_value',
        null, null, null, null, 0.93, null,
        '{"roi_indicators": ["saved 20 hours per week", "improve campaign ROI by 35%"], "business_metrics": {"time_savings": "20 hours/week", "efficiency_increase": "35%"}, "value_proposition": "Time savings and improved marketing effectiveness"}',
        '1.2.0'
    ),
    (
        '30000000-0000-0000-0000-000000000003',
        '20000000-0000-0000-0000-000000000002',
        'business_value',
        null, null, null, null, 0.97, null,
        '{"roi_indicators": ["growth rate double from 15% to 30%", "clear and substantial ROI"], "business_metrics": {"growth_increase": "100%", "quarterly_growth": "30%"}, "value_proposition": "Accelerated business growth without administrative overhead"}',
        '1.2.0'
    ),
    (
        '30000000-0000-0000-0000-000000000004',
        '20000000-0000-0000-0000-000000000003',
        'business_value',
        null, null, null, null, 0.89, null,
        '{"roi_indicators": ["reduced stockouts by 78%", "saved countless hours"], "business_metrics": {"stockout_reduction": "78%"}, "value_proposition": "Inventory optimization and operational efficiency"}',
        '1.2.0'
    ),
    (
        '30000000-0000-0000-0000-000000000005',
        '20000000-0000-0000-0000-000000000004',
        'sentiment',
        0.88, 0.92, 0.75, 0.85, 0.90, 0.95,
        '{"key_emotions": ["satisfaction", "relief", "confidence"], "positive_phrases": ["stands out", "thoughtful integration", "improved overall codebase health"], "detailed_breakdown": {"praise_specificity": 0.95, "personal_voice": 0.8, "concrete_results": 0.9}}',
        '1.2.0'
    ),
    (
        '30000000-0000-0000-0000-000000000006',
        '20000000-0000-0000-0000-000000000007',
        'business_value',
        null, null, null, null, 0.94, null,
        '{"roi_indicators": ["reduced monthly churn rate from 4.2% to 2.3%", "45% improvement"], "business_metrics": {"churn_reduction": "45%", "retention_increase": "substantial"}, "value_proposition": "Improved customer retention directly impacting bottom line"}',
        '1.2.0'
    ),
    (
        '30000000-0000-0000-0000-000000000007',
        '20000000-0000-0000-0000-000000000008',
        'sentiment',
        0.90, 0.87, 0.88, 0.82, 0.85, 0.89,
        '{"key_emotions": ["satisfaction", "surprise", "alignment"], "positive_phrases": ["delivered on both fronts", "unexpected but welcome feature", "win-win"], "detailed_breakdown": {"praise_specificity": 0.85, "personal_voice": 0.9, "concrete_results": 0.88}}',
        '1.2.0'
    ),
    (
        '30000000-0000-0000-0000-000000000008',
        '20000000-0000-0000-0000-000000000009',
        'credibility',
        null, null, null, null, null, 0.95,
        '{"expertise_indicators": ["developing applications in healthcare", "security, compliance, and reliability"], "specificity_score": 0.92, "technical_accuracy": 0.97, "consistency": 0.94, "contextual_knowledge": 0.96}',
        '1.2.0'
    ),
    (
        '30000000-0000-0000-0000-000000000009',
        '20000000-0000-0000-0000-000000000010',
        'business_value',
        null, null, null, null, 0.91, null,
        '{"roi_indicators": ["reduced close time from 15 days to 5", "reduced finance team overtime by 70%"], "business_metrics": {"close_time_reduction": "67%", "overtime_reduction": "70%"}, "value_proposition": "Faster financial insights and reduced operational costs"}',
        '1.2.0'
    ),
    (
        '30000000-0000-0000-0000-000000000010',
        '20000000-0000-0000-0000-000000000005',
        'narrative',
        null, null, null, 0.88, null, null,
        '{"story_arc": "challenge-solution-outcome", "coherence": 0.9, "specificity": 0.87, "progression": 0.89, "authenticity_markers": ["personal experience", "specific details", "balanced perspective"]}',
        '1.2.0'
    );

-- 4. Create Competitor Mentions
INSERT INTO competitor_mentions (
    id, testimonial_id, competitor_name,
    context, sentiment, sentiment_score,
    comparison_type, ai_confidence_score
)
VALUES
    (
        '40000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000003',
        'InventoryMaster',
        'The real-time inventory tracking has reduced our stockouts by 78%, which we could never achieve with InventoryMaster.',
        'negative',
        0.25,
        'performance',
        0.88
    ),
    (
        '40000000-0000-0000-0000-000000000002',
        '20000000-0000-0000-0000-000000000004',
        'DevForge',
        'I''ve tried numerous development environments. This one stands out for its thoughtful integration of CI/CD pipelines and seamless collaboration features compared to DevForge.',
        'negative',
        0.35,
        'features',
        0.92
    ),
    (
        '40000000-0000-0000-0000-000000000003',
        '20000000-0000-0000-0000-000000000006',
        'SalesTrack CRM',
        'Eliminates much of the administrative burden they used to face with our previous solution, SalesTrack CRM.',
        'negative',
        0.30,
        'usability',
        0.85
    );

END $$;