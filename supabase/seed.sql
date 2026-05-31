-- =============================================
-- EstateFlow CRM - Seed Data
-- seed.sql
-- =============================================

-- 1. Create Organization
INSERT INTO organizations (id, name, slug, address, phone, email)
VALUES ('77777777-7777-7777-7777-777777777777', 'EstateFlow Demo Org', 'demo', 'Cyber City, Gurgaon, India', '+91 99999 00000', 'contact@estateflow.demo');

-- 2. Create Users (Assuming auth.users exist, otherwise map manually)
-- In a real scenario, users are created via auth.signUp. 
-- For development, manually add to public.users after signing up via UI.

-- 3. Sample Properties
INSERT INTO properties (organization_id, title, location, type, price, size, bedrooms, bathrooms, status, amenities, images)
VALUES 
('77777777-7777-7777-7777-777777777777', 'Premium 4BHK Sky Villa', 'Golf Course Road, Gurgaon', 'penthouse', 85000000, 4500, 4, 5, 'available', ARRAY['Private Pool', 'Home Automation', 'Concierge', 'Skylight'], ARRAY['https://images.unsplash.com/photo-1600585154340-be6199f7d009']),
('77777777-7777-7777-7777-777777777777', 'Modern 3BHK Apartment', 'Sector 67, Gurgaon', 'apartment', 14500000, 1850, 3, 3, 'available', ARRAY['Gym', 'Park', 'Clubhouse'], ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750']),
('77777777-7777-7777-7777-777777777777', 'Eco-friendly Luxury Villa', 'DLF Phase 5, Gurgaon', 'villa', 52500000, 3200, 5, 6, 'under_construction', ARRAY['Solar Panels', 'Garden', 'Security'], ARRAY['https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde']),
('77777777-7777-7777-7777-777777777777', 'High-street Commercial Space', 'MG Road, Gurgaon', 'commercial', 22000000, 850, 0, 1, 'available', ARRAY['Parking', 'High Visibility', 'Fire Safety'], ARRAY['https://images.unsplash.com/photo-1497366216548-37526070297c']);

-- 4. Sample Leads
INSERT INTO leads (organization_id, name, phone, email, source, property_type, budget_min, budget_max, status, temperature, notes)
VALUES 
('77777777-7777-7777-7777-777777777777', 'Rahul Sharma', '+91 98765 43210', 'rahul@example.com', 'website', 'apartment', 12000000, 15000000, 'new', 'hot', 'Looking for immediate possession in Sector 67.'),
('77777777-7777-7777-7777-777777777777', 'Priya Iyer', '+91 88888 77777', 'priya@example.com', 'referral', 'villa', 45000000, 60000000, 'contacted', 'warm', 'Interested in DLF Phase 5 villas.'),
('77777777-7777-7777-7777-777777777777', 'Vikram Singh', '+91 77777 66666', 'vikram@example.com', 'social_media', 'penthouse', 75000000, 95000000, 'qualified', 'hot', 'High net worth client, checking sky villas.'),
('77777777-7777-7777-7777-777777777777', 'Anita Desai', '+91 66666 55555', 'anita@example.com', 'portal', 'apartment', 8000000, 10000000, 'new', 'cold', 'First-time home buyer, exploring options.');

-- 5. Sample Activities
INSERT INTO activities (organization_id, lead_id, type, title, description)
SELECT organization_id, id, 'note', 'Initial enquiry received', 'Lead expressed interest via website form' FROM leads;

-- 6. Sample Social Posts
INSERT INTO social_posts (organization_id, created_by, title, caption, status, platforms)
VALUES 
('77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000000', 'New Launch Alert', 'Experience the pinnacle of luxury at our latest project. ✨ #EstateFlow #LuxuryLiving', 'scheduled', ARRAY['instagram', 'facebook']),
('77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000000', 'Success Story', 'Another happy family finds their dream home! 🏡❤️ #HappyClients #RealEstate', 'published', ARRAY['instagram', 'linkedin']);

-- NOTE: Replace '00000000-0000-0000-0000-000000000000' with a real user ID after signup.
