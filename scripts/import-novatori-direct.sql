-- Direct import - simpler approach that inserts for ALL courses
-- Run this AFTER running create-learning-tables.sql

-- Step 1: Clear existing data
DELETE FROM topics;
DELETE FROM technologies;

-- Step 2: Show your courses (copy the IDs you need)
SELECT id, name, slug FROM courses;

-- Step 3: Insert technologies directly for each course
-- We'll insert for ALL courses and you can see which ones work

-- For EVERY course, try to insert based on name patterns:

-- Insert HTML/CSS for courses containing 'react' or 'frontend' or 'დეველოპერი'
INSERT INTO technologies (course_id, name, slug, description, icon, order_index, is_active)
SELECT
    c.id,
    'HTML',
    'html',
    'HTML საფუძვლები - როგორ წავიკითხოთ და ვწეროთ HTML დოკუმენტები',
    '🌐',
    1,
    true
FROM courses c
WHERE c.name ILIKE '%react%'
   OR c.name ILIKE '%frontend%'
   OR c.name ILIKE '%დეველოპერი%'
   OR c.slug ILIKE '%react%'
   OR c.slug ILIKE '%frontend%';

INSERT INTO technologies (course_id, name, slug, description, icon, order_index, is_active)
SELECT
    c.id,
    'CSS',
    'css',
    'CSS საფუძვლები - სტილების გამოყენება ვებ გვერდებზე',
    '🎨',
    2,
    true
FROM courses c
WHERE c.name ILIKE '%react%'
   OR c.name ILIKE '%frontend%'
   OR c.name ILIKE '%დეველოპერი%'
   OR c.slug ILIKE '%react%'
   OR c.slug ILIKE '%frontend%';

-- Insert UI/UX and Figma for design courses
INSERT INTO technologies (course_id, name, slug, description, icon, order_index, is_active)
SELECT
    c.id,
    'UI/UX საფუძვლები',
    'ui-ux-basics',
    'შესავალი UI/UX დიზაინში',
    '✨',
    1,
    true
FROM courses c
WHERE c.name ILIKE '%ui%'
   OR c.name ILIKE '%ux%'
   OR c.name ILIKE '%design%'
   OR c.name ILIKE '%დიზაინ%'
   OR c.slug ILIKE '%design%';

INSERT INTO technologies (course_id, name, slug, description, icon, order_index, is_active)
SELECT
    c.id,
    'Figma',
    'figma',
    'Figma-ს გამოყენება UI დიზაინისთვის',
    '🎯',
    2,
    true
FROM courses c
WHERE c.name ILIKE '%ui%'
   OR c.name ILIKE '%ux%'
   OR c.name ILIKE '%design%'
   OR c.name ILIKE '%დიზაინ%'
   OR c.slug ILIKE '%design%';

-- Insert for English courses
INSERT INTO technologies (course_id, name, slug, description, icon, order_index, is_active)
SELECT
    c.id,
    'General English',
    'general-english',
    'ზოგადი ინგლისური ენის კურსი',
    '🇬🇧',
    1,
    true
FROM courses c
WHERE c.name ILIKE '%english%basic%'
   OR c.slug ILIKE '%english-basic%';

INSERT INTO technologies (course_id, name, slug, description, icon, order_index, is_active)
SELECT
    c.id,
    'Conversation English',
    'conversation-english',
    'სასაუბრო ინგლისური ენის კურსი',
    '💬',
    1,
    true
FROM courses c
WHERE c.name ILIKE '%english%convo%'
   OR c.slug ILIKE '%english-convo%';

-- Show what technologies were created
SELECT 'Technologies created:' as info;
SELECT t.id, t.name, t.slug, t.is_active, c.name as course_name
FROM technologies t
JOIN courses c ON t.course_id = c.id;

-- Step 4: Insert topics for HTML technology
INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index, is_active)
SELECT
    t.id,
    topic.name,
    topic.slug,
    topic.description,
    topic.duration,
    topic.theory_video,
    topic.miro_link,
    topic.order_index,
    true
FROM technologies t
CROSS JOIN (
    VALUES
        ('როგორ წავიკითხოთ და ვწეროთ HTML', 'r1-html-basics', 'HTML-ის საფუძვლები და სინტაქსი', 45, 'https://www.youtube.com/embed/yLt8XkY8Ar8', NULL::text, 1),
        ('HTML დოკუმენტის ანატომია', 'r2-html-anatomy', 'HTML დოკუმენტის სტრუქტურა და ელემენტები', 18, 'https://www.youtube.com/embed/Cyu5EoMjBYg', NULL::text, 2),
        ('ტექსტური ინფორმაცია HTML-ში', 'r3-html-text', 'ტექსტის ფორმატირება HTML-ში', 16, 'https://www.youtube.com/embed/5xTHTsdr9Dg', NULL::text, 3),
        ('ლინკები, URL-ები და Path-ები', 'r4-links-urls', 'ჰიპერლინკები და ნავიგაცია', 20, 'https://www.youtube.com/embed/4MCh0zc85Tk', NULL::text, 4),
        ('Embed: ფოტოები, აუდიო-ვიდეო, Iframe', 'r5-embed-media', 'მედია კონტენტის ჩასმა HTML-ში', 15, 'https://www.youtube.com/embed/RigS9fOCxWo', 'https://miro.com/app/board/uXjVPx_saHM=/', 5),
        ('ცხრილები (Table)', 'r6-tables', 'HTML ცხრილების შექმნა და სტილიზაცია', 18, 'https://youtube.com/embed/VHdlP1_wKIA', 'https://miro.com/app/board/uXjVPuD4TOM=/', 6),
        ('ფორმები', 'r7-forms', 'HTML ფორმების შექმნა და ვალიდაცია', 24, 'https://youtube.com/embed/qMWuLAkjkMA', 'https://miro.com/app/board/uXjVPtgVav8=/', 7),
        ('სემანტიკური ტეგები და HTML-ის ვალიდაცია', 'r8-semantic-tags', 'სემანტიკური HTML და ვალიდაცია', 18, 'https://youtube.com/embed/_Jw0aqwwuTw', 'https://miro.com/app/board/uXjVPt2v948=/', 8)
) AS topic(name, slug, description, duration, theory_video, miro_link, order_index)
WHERE t.slug = 'html';

-- Insert topics for CSS technology
INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index, is_active)
SELECT
    t.id,
    'როგორ წავიკითხოთ და ვწეროთ CSS',
    'r9-css-basics',
    'CSS-ის საფუძვლები და სინტაქსი',
    20,
    'https://youtube.com/embed/3R6nmExbDUE',
    'https://miro.com/app/board/uXjVPtLXetE=/',
    1,
    true
FROM technologies t
WHERE t.slug = 'css';

-- Insert topics for UI/UX Basics
INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index, is_active)
SELECT
    t.id,
    'შესავალი UI/UX დიზაინში',
    'd1-intro-ui-ux',
    'UI/UX დიზაინის საფუძვლები',
    15,
    NULL,
    NULL,
    1,
    true
FROM technologies t
WHERE t.slug = 'ui-ux-basics';

-- Insert topics for Figma
INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index, is_active)
SELECT
    t.id,
    topic.name,
    topic.slug,
    topic.description,
    topic.duration,
    topic.theory_video,
    topic.miro_link,
    topic.order_index,
    true
FROM technologies t
CROSS JOIN (
    VALUES
        ('როგორ გამოვიყენოთ Figma', 'd2-figma-basics', 'Figma-ს ინტერფეისი და გლობალური სტილები', 15, 'https://www.youtube.com/embed/Y7cBS4EbB2U', 'https://www.figma.com/file/txkoQAp4Y5zquZeXPM3rbM/', 1),
        ('როგორ გამოვიყენოთ Figma (გაგრძელება)', 'd3-figma-continued', 'Figma-ს მოწინავე ფუნქციები', 15, 'https://www.youtube.com/embed/Y7cBS4EbB2U', 'https://www.figma.com/file/txkoQAp4Y5zquZeXPM3rbM/', 2),
        ('ავტომატური განლაგებები Figma-ში', 'd4-auto-layout', 'Auto Layout ფუნქციონალი', 19, NULL::text, 'https://www.figma.com/file/rHGS8arO6daIzTlouUcl45/', 3),
        ('კომპონენტები Figma-ში', 'd5-components', 'კომპონენტების შექმნა და გამოყენება', 19, 'https://www.youtube.com/embed/KuHceB318YU', 'https://www.figma.com/file/vGZAUg9ySxQYfVKF5N5Vym/', 4),
        ('პროტოტიპები და ინტერაქციები', 'd6-prototypes', 'პროტოტიპების შექმნა და ინტერაქტიული დიზაინი', 20, NULL::text, NULL::text, 5)
) AS topic(name, slug, description, duration, theory_video, miro_link, order_index)
WHERE t.slug = 'figma';

-- Insert topics for English Basic
INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index, is_active)
SELECT
    t.id,
    topic.name,
    topic.slug,
    topic.description,
    topic.duration,
    NULL,
    NULL,
    topic.order_index,
    true
FROM technologies t
CROSS JOIN (
    VALUES
        ('Introduction', 'eb-introduction', 'შესავალი ინგლისურში', 90, 1),
        ('Food', 'eb-food', 'საკვების თემატიკა', 90, 2),
        ('Travel', 'eb-travel', 'მოგზაურობის თემატიკა', 90, 3),
        ('Student Presentations', 'eb-presentations', 'სტუდენტების პრეზენტაციები', 120, 4)
) AS topic(name, slug, description, duration, order_index)
WHERE t.slug = 'general-english';

-- Insert topics for English Convo
INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index, is_active)
SELECT
    t.id,
    topic.name,
    topic.slug,
    topic.description,
    topic.duration,
    NULL,
    NULL,
    topic.order_index,
    true
FROM technologies t
CROSS JOIN (
    VALUES
        ('Introduction', 'ec-introduction', 'შესავალი სასაუბრო ინგლისურში', 90, 1),
        ('Food', 'ec-food', 'საკვების თემატიკა', 90, 2),
        ('Travel', 'ec-travel', 'მოგზაურობის თემატიკა', 90, 3),
        ('Student Presentations', 'ec-presentations', 'სტუდენტების პრეზენტაციები', 120, 4)
) AS topic(name, slug, description, duration, order_index)
WHERE t.slug = 'conversation-english';

-- Final verification
SELECT '=== FINAL RESULTS ===' as status;

SELECT 'Technologies' as type, COUNT(*) as count FROM technologies
UNION ALL
SELECT 'Topics' as type, COUNT(*) as count FROM topics;

-- Show full structure
SELECT
    c.name as course_name,
    t.name as technology_name,
    t.icon,
    t.is_active,
    COUNT(tp.id) as topic_count
FROM courses c
LEFT JOIN technologies t ON t.course_id = c.id
LEFT JOIN topics tp ON tp.technology_id = t.id
GROUP BY c.id, c.name, t.id, t.name, t.icon, t.is_active, t.order_index
ORDER BY c.name, t.order_index;
