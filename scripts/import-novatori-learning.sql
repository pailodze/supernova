-- Import learning data from novatori.sql backup
-- This script clears existing data and imports fresh from the backup

-- Step 1: Clear existing data (topics first due to FK constraint)
TRUNCATE TABLE topics CASCADE;
TRUNCATE TABLE technologies CASCADE;

-- Step 2: Create a temporary mapping table to link old course IDs to new course IDs
-- You'll need to update these UUIDs based on your actual courses table
-- Run: SELECT id, name, slug FROM courses; to get your course IDs

-- Create temp table for course mapping
CREATE TEMP TABLE course_mapping (
    old_id INTEGER,
    new_id UUID,
    course_name TEXT
);

-- INSERT YOUR ACTUAL COURSE IDs HERE
-- Run this query first to get your course IDs:
-- SELECT id, name, slug FROM courses;

-- Example (UPDATE THESE WITH YOUR REAL UUIDs):
-- INSERT INTO course_mapping VALUES
--     (2, 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'React Frontend'),
--     (3, 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'English Basic'),
--     (4, 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'English Convo'),
--     (5, 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'UI/UX Design');

-- Auto-detect courses by name matching
INSERT INTO course_mapping (old_id, new_id, course_name)
SELECT 2, id, name FROM courses WHERE name ILIKE '%react%' OR name ILIKE '%frontend%' LIMIT 1;

INSERT INTO course_mapping (old_id, new_id, course_name)
SELECT 3, id, name FROM courses WHERE name ILIKE '%english%basic%' OR slug ILIKE '%english-basic%' LIMIT 1;

INSERT INTO course_mapping (old_id, new_id, course_name)
SELECT 4, id, name FROM courses WHERE name ILIKE '%english%convo%' OR slug ILIKE '%english-convo%' LIMIT 1;

INSERT INTO course_mapping (old_id, new_id, course_name)
SELECT 5, id, name FROM courses WHERE name ILIKE '%ui%ux%' OR name ILIKE '%დიზაინ%' OR name ILIKE '%design%' LIMIT 1;

-- Show mapping results
SELECT * FROM course_mapping;

-- Step 3: Insert technologies (grouped by topic prefix)
-- React Frontend course gets: HTML (R1-R8), CSS (R9+)
-- UI/UX Design course gets: UI/UX Basics (D1), Figma (D2-D6)
-- English courses get: General topics

-- React Frontend - HTML Technology
INSERT INTO technologies (course_id, name, slug, description, icon, order_index)
SELECT
    cm.new_id,
    'HTML',
    'html',
    'HTML საფუძვლები - როგორ წავიკითხოთ და ვწეროთ HTML დოკუმენტები',
    '🌐',
    1
FROM course_mapping cm
WHERE cm.old_id = 2 AND cm.new_id IS NOT NULL
ON CONFLICT (course_id, slug) DO NOTHING;

-- React Frontend - CSS Technology
INSERT INTO technologies (course_id, name, slug, description, icon, order_index)
SELECT
    cm.new_id,
    'CSS',
    'css',
    'CSS საფუძვლები - სტილების გამოყენება ვებ გვერდებზე',
    '🎨',
    2
FROM course_mapping cm
WHERE cm.old_id = 2 AND cm.new_id IS NOT NULL
ON CONFLICT (course_id, slug) DO NOTHING;

-- UI/UX Design - UI/UX Basics Technology
INSERT INTO technologies (course_id, name, slug, description, icon, order_index)
SELECT
    cm.new_id,
    'UI/UX საფუძვლები',
    'ui-ux-basics',
    'შესავალი UI/UX დიზაინში',
    '✨',
    1
FROM course_mapping cm
WHERE cm.old_id = 5 AND cm.new_id IS NOT NULL
ON CONFLICT (course_id, slug) DO NOTHING;

-- UI/UX Design - Figma Technology
INSERT INTO technologies (course_id, name, slug, description, icon, order_index)
SELECT
    cm.new_id,
    'Figma',
    'figma',
    'Figma-ს გამოყენება UI დიზაინისთვის',
    '🎯',
    2
FROM course_mapping cm
WHERE cm.old_id = 5 AND cm.new_id IS NOT NULL
ON CONFLICT (course_id, slug) DO NOTHING;

-- English Basic - General Technology
INSERT INTO technologies (course_id, name, slug, description, icon, order_index)
SELECT
    cm.new_id,
    'General English',
    'general-english',
    'ზოგადი ინგლისური ენის კურსი',
    '🇬🇧',
    1
FROM course_mapping cm
WHERE cm.old_id = 3 AND cm.new_id IS NOT NULL
ON CONFLICT (course_id, slug) DO NOTHING;

-- English Convo - Conversation Technology
INSERT INTO technologies (course_id, name, slug, description, icon, order_index)
SELECT
    cm.new_id,
    'Conversation English',
    'conversation-english',
    'სასაუბრო ინგლისური ენის კურსი',
    '💬',
    1
FROM course_mapping cm
WHERE cm.old_id = 4 AND cm.new_id IS NOT NULL
ON CONFLICT (course_id, slug) DO NOTHING;

-- Step 4: Insert topics from novatori.sql backup

-- HTML Topics (R1-R8) - courseId=2 topics that start with R and are about HTML
INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
    t.id,
    'როგორ წავიკითხოთ და ვწეროთ HTML',
    'r1-html-basics',
    'HTML-ის საფუძვლები და სინტაქსი',
    45,
    'https://www.youtube.com/embed/yLt8XkY8Ar8',
    NULL,
    1
FROM technologies t
JOIN course_mapping cm ON t.course_id = cm.new_id
WHERE cm.old_id = 2 AND t.slug = 'html'
ON CONFLICT (technology_id, slug) DO NOTHING;

INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
    t.id,
    'HTML დოკუმენტის ანატომია',
    'r2-html-anatomy',
    'HTML დოკუმენტის სტრუქტურა და ელემენტები',
    18,
    'https://www.youtube.com/embed/Cyu5EoMjBYg',
    NULL,
    2
FROM technologies t
JOIN course_mapping cm ON t.course_id = cm.new_id
WHERE cm.old_id = 2 AND t.slug = 'html'
ON CONFLICT (technology_id, slug) DO NOTHING;

INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
    t.id,
    'ტექსტური ინფორმაცია HTML-ში',
    'r3-html-text',
    'ტექსტის ფორმატირება HTML-ში',
    16,
    'https://www.youtube.com/embed/5xTHTsdr9Dg',
    NULL,
    3
FROM technologies t
JOIN course_mapping cm ON t.course_id = cm.new_id
WHERE cm.old_id = 2 AND t.slug = 'html'
ON CONFLICT (technology_id, slug) DO NOTHING;

INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
    t.id,
    'ლინკები, URL-ები და Path-ები',
    'r4-links-urls',
    'ჰიპერლინკები და ნავიგაცია',
    20,
    'https://www.youtube.com/embed/4MCh0zc85Tk',
    NULL,
    4
FROM technologies t
JOIN course_mapping cm ON t.course_id = cm.new_id
WHERE cm.old_id = 2 AND t.slug = 'html'
ON CONFLICT (technology_id, slug) DO NOTHING;

INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
    t.id,
    'Embed: ფოტოები, აუდიო-ვიდეო, Iframe',
    'r5-embed-media',
    'მედია კონტენტის ჩასმა HTML-ში',
    15,
    'https://www.youtube.com/embed/RigS9fOCxWo',
    'https://miro.com/app/board/uXjVPx_saHM=/',
    5
FROM technologies t
JOIN course_mapping cm ON t.course_id = cm.new_id
WHERE cm.old_id = 2 AND t.slug = 'html'
ON CONFLICT (technology_id, slug) DO NOTHING;

INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
    t.id,
    'ცხრილები (Table)',
    'r6-tables',
    'HTML ცხრილების შექმნა და სტილიზაცია',
    18,
    'https://youtube.com/embed/VHdlP1_wKIA',
    'https://miro.com/app/board/uXjVPuD4TOM=/',
    6
FROM technologies t
JOIN course_mapping cm ON t.course_id = cm.new_id
WHERE cm.old_id = 2 AND t.slug = 'html'
ON CONFLICT (technology_id, slug) DO NOTHING;

INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
    t.id,
    'ფორმები',
    'r7-forms',
    'HTML ფორმების შექმნა და ვალიდაცია',
    24,
    'https://youtube.com/embed/qMWuLAkjkMA',
    'https://miro.com/app/board/uXjVPtgVav8=/',
    7
FROM technologies t
JOIN course_mapping cm ON t.course_id = cm.new_id
WHERE cm.old_id = 2 AND t.slug = 'html'
ON CONFLICT (technology_id, slug) DO NOTHING;

INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
    t.id,
    'სემანტიკური ტეგები და HTML-ის ვალიდაცია',
    'r8-semantic-tags',
    'სემანტიკური HTML და ვალიდაცია',
    18,
    'https://youtube.com/embed/_Jw0aqwwuTw',
    'https://miro.com/app/board/uXjVPt2v948=/',
    8
FROM technologies t
JOIN course_mapping cm ON t.course_id = cm.new_id
WHERE cm.old_id = 2 AND t.slug = 'html'
ON CONFLICT (technology_id, slug) DO NOTHING;

-- CSS Topics (R9)
INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
    t.id,
    'როგორ წავიკითხოთ და ვწეროთ CSS',
    'r9-css-basics',
    'CSS-ის საფუძვლები და სინტაქსი',
    20,
    'https://youtube.com/embed/3R6nmExbDUE',
    'https://miro.com/app/board/uXjVPtLXetE=/',
    1
FROM technologies t
JOIN course_mapping cm ON t.course_id = cm.new_id
WHERE cm.old_id = 2 AND t.slug = 'css'
ON CONFLICT (technology_id, slug) DO NOTHING;

-- UI/UX Basics Topics (D1)
INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
    t.id,
    'შესავალი UI/UX დიზაინში',
    'd1-intro-ui-ux',
    'UI/UX დიზაინის საფუძვლები',
    15,
    NULL,
    NULL,
    1
FROM technologies t
JOIN course_mapping cm ON t.course_id = cm.new_id
WHERE cm.old_id = 5 AND t.slug = 'ui-ux-basics'
ON CONFLICT (technology_id, slug) DO NOTHING;

-- Figma Topics (D2-D6)
INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
    t.id,
    'როგორ გამოვიყენოთ Figma',
    'd2-figma-basics',
    'Figma-ს ინტერფეისი და გლობალური სტილები',
    15,
    'https://www.youtube.com/embed/Y7cBS4EbB2U',
    'https://www.figma.com/file/txkoQAp4Y5zquZeXPM3rbM/',
    1
FROM technologies t
JOIN course_mapping cm ON t.course_id = cm.new_id
WHERE cm.old_id = 5 AND t.slug = 'figma'
ON CONFLICT (technology_id, slug) DO NOTHING;

INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
    t.id,
    'როგორ გამოვიყენოთ Figma (გაგრძელება)',
    'd3-figma-continued',
    'Figma-ს მოწინავე ფუნქციები',
    15,
    'https://www.youtube.com/embed/Y7cBS4EbB2U',
    'https://www.figma.com/file/txkoQAp4Y5zquZeXPM3rbM/',
    2
FROM technologies t
JOIN course_mapping cm ON t.course_id = cm.new_id
WHERE cm.old_id = 5 AND t.slug = 'figma'
ON CONFLICT (technology_id, slug) DO NOTHING;

INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
    t.id,
    'ავტომატური განლაგებები Figma-ში',
    'd4-auto-layout',
    'Auto Layout ფუნქციონალი',
    19,
    NULL,
    'https://www.figma.com/file/rHGS8arO6daIzTlouUcl45/',
    3
FROM technologies t
JOIN course_mapping cm ON t.course_id = cm.new_id
WHERE cm.old_id = 5 AND t.slug = 'figma'
ON CONFLICT (technology_id, slug) DO NOTHING;

INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
    t.id,
    'კომპონენტები Figma-ში',
    'd5-components',
    'კომპონენტების შექმნა და გამოყენება',
    19,
    'https://www.youtube.com/embed/KuHceB318YU',
    'https://www.figma.com/file/vGZAUg9ySxQYfVKF5N5Vym/',
    4
FROM technologies t
JOIN course_mapping cm ON t.course_id = cm.new_id
WHERE cm.old_id = 5 AND t.slug = 'figma'
ON CONFLICT (technology_id, slug) DO NOTHING;

INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
    t.id,
    'პროტოტიპები და ინტერაქციები',
    'd6-prototypes',
    'პროტოტიპების შექმნა და ინტერაქტიული დიზაინი',
    20,
    NULL,
    NULL,
    5
FROM technologies t
JOIN course_mapping cm ON t.course_id = cm.new_id
WHERE cm.old_id = 5 AND t.slug = 'figma'
ON CONFLICT (technology_id, slug) DO NOTHING;

-- English Basic Topics
INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
    t.id,
    'Introduction',
    'eb-introduction',
    'შესავალი ინგლისურში',
    90,
    NULL,
    NULL,
    1
FROM technologies t
JOIN course_mapping cm ON t.course_id = cm.new_id
WHERE cm.old_id = 3 AND t.slug = 'general-english'
ON CONFLICT (technology_id, slug) DO NOTHING;

INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
    t.id,
    'Food',
    'eb-food',
    'საკვების თემატიკა',
    90,
    NULL,
    NULL,
    2
FROM technologies t
JOIN course_mapping cm ON t.course_id = cm.new_id
WHERE cm.old_id = 3 AND t.slug = 'general-english'
ON CONFLICT (technology_id, slug) DO NOTHING;

INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
    t.id,
    'Travel',
    'eb-travel',
    'მოგზაურობის თემატიკა',
    90,
    NULL,
    NULL,
    3
FROM technologies t
JOIN course_mapping cm ON t.course_id = cm.new_id
WHERE cm.old_id = 3 AND t.slug = 'general-english'
ON CONFLICT (technology_id, slug) DO NOTHING;

INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
    t.id,
    'Student Presentations',
    'eb-presentations',
    'სტუდენტების პრეზენტაციები',
    120,
    NULL,
    NULL,
    4
FROM technologies t
JOIN course_mapping cm ON t.course_id = cm.new_id
WHERE cm.old_id = 3 AND t.slug = 'general-english'
ON CONFLICT (technology_id, slug) DO NOTHING;

-- English Convo Topics
INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
    t.id,
    'Introduction',
    'ec-introduction',
    'შესავალი სასაუბრო ინგლისურში',
    90,
    NULL,
    NULL,
    1
FROM technologies t
JOIN course_mapping cm ON t.course_id = cm.new_id
WHERE cm.old_id = 4 AND t.slug = 'conversation-english'
ON CONFLICT (technology_id, slug) DO NOTHING;

INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
    t.id,
    'Food',
    'ec-food',
    'საკვების თემატიკა',
    90,
    NULL,
    NULL,
    2
FROM technologies t
JOIN course_mapping cm ON t.course_id = cm.new_id
WHERE cm.old_id = 4 AND t.slug = 'conversation-english'
ON CONFLICT (technology_id, slug) DO NOTHING;

INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
    t.id,
    'Travel',
    'ec-travel',
    'მოგზაურობის თემატიკა',
    90,
    NULL,
    NULL,
    3
FROM technologies t
JOIN course_mapping cm ON t.course_id = cm.new_id
WHERE cm.old_id = 4 AND t.slug = 'conversation-english'
ON CONFLICT (technology_id, slug) DO NOTHING;

INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
    t.id,
    'Student Presentations',
    'ec-presentations',
    'სტუდენტების პრეზენტაციები',
    120,
    NULL,
    NULL,
    4
FROM technologies t
JOIN course_mapping cm ON t.course_id = cm.new_id
WHERE cm.old_id = 4 AND t.slug = 'conversation-english'
ON CONFLICT (technology_id, slug) DO NOTHING;

-- Drop temp table
DROP TABLE course_mapping;

-- Step 5: Verify results
SELECT '=== IMPORT COMPLETE ===' as status;

SELECT 'Technologies' as type, COUNT(*) as count FROM technologies
UNION ALL
SELECT 'Topics' as type, COUNT(*) as count FROM topics;

-- Show full structure
SELECT
    c.name as course_name,
    t.name as technology_name,
    t.icon,
    COUNT(tp.id) as topic_count
FROM courses c
LEFT JOIN technologies t ON t.course_id = c.id
LEFT JOIN topics tp ON tp.technology_id = t.id
GROUP BY c.id, c.name, t.id, t.name, t.icon, t.order_index
ORDER BY c.name, t.order_index;
