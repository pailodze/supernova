-- First, let's see what courses exist
-- SELECT id, name, slug FROM courses;

-- Insert technologies for ALL courses (adjust based on your actual course IDs)
-- This script uses a DO block to dynamically insert based on existing courses

DO $$
DECLARE
    react_course_id UUID;
    uiux_course_id UUID;
BEGIN
    -- Try to find React/Frontend course
    SELECT id INTO react_course_id FROM courses
    WHERE name ILIKE '%react%' OR name ILIKE '%frontend%' OR slug ILIKE '%react%' OR slug ILIKE '%frontend%'
    LIMIT 1;

    -- Try to find UI/UX course
    SELECT id INTO uiux_course_id FROM courses
    WHERE name ILIKE '%ui%' OR name ILIKE '%ux%' OR name ILIKE '%design%' OR slug ILIKE '%design%'
    LIMIT 1;

    -- Insert technologies for React course if found
    IF react_course_id IS NOT NULL THEN
        INSERT INTO technologies (course_id, name, slug, description, icon, order_index)
        VALUES
            (react_course_id, 'HTML', 'html', 'HTML საფუძვლები - როგორ წავიკითხოთ და ვწეროთ HTML დოკუმენტები', '🌐', 1),
            (react_course_id, 'CSS', 'css', 'CSS საფუძვლები - სტილების გამოყენება ვებ გვერდებზე', '🎨', 2)
        ON CONFLICT (course_id, slug) DO NOTHING;

        RAISE NOTICE 'Inserted technologies for React course: %', react_course_id;
    ELSE
        RAISE NOTICE 'React/Frontend course not found';
    END IF;

    -- Insert technologies for UI/UX course if found
    IF uiux_course_id IS NOT NULL THEN
        INSERT INTO technologies (course_id, name, slug, description, icon, order_index)
        VALUES
            (uiux_course_id, 'UI/UX საფუძვლები', 'ui-ux-basics', 'შესავალი UI/UX დიზაინში', '✨', 1),
            (uiux_course_id, 'Figma', 'figma', 'Figma-ს გამოყენება UI დიზაინისთვის', '��', 2)
        ON CONFLICT (course_id, slug) DO NOTHING;

        RAISE NOTICE 'Inserted technologies for UI/UX course: %', uiux_course_id;
    ELSE
        RAISE NOTICE 'UI/UX course not found';
    END IF;
END $$;

-- Now insert topics for the technologies we just created
-- HTML Topics
INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
    t.id,
    topic_data.name,
    topic_data.slug,
    topic_data.description,
    topic_data.duration,
    topic_data.theory_video,
    topic_data.miro_link,
    topic_data.order_index
FROM technologies t
CROSS JOIN (
    VALUES
        ('როგორ წავიკითხოთ და ვწეროთ HTML', 'r1-html-basics', 'HTML-ის საფუძვლები და სინტაქსი', 45, 'https://www.youtube.com/embed/yLt8XkY8Ar8', NULL, 1),
        ('HTML დოკუმენტის ანატომია', 'r2-html-anatomy', 'HTML დოკუმენტის სტრუქტურა და ელემენტები', 18, 'https://www.youtube.com/embed/Cyu5EoMjBYg', NULL, 2),
        ('ტექსტური ინფორმაცია HTML-ში', 'r3-html-text', 'ტექსტის ფორმატირება HTML-ში', 16, 'https://www.youtube.com/embed/5xTHTsdr9Dg', NULL, 3),
        ('ლინკები, URL-ები და Path-ები', 'r4-links-urls', 'ჰიპერლინკები და ნავიგაცია', 20, 'https://www.youtube.com/embed/4MCh0zc85Tk', NULL, 4),
        ('Embed: ფოტოები, აუდიო-ვიდეო, Iframe', 'r5-embed-media', 'მედია კონტენტის ჩასმა HTML-ში', 15, 'https://www.youtube.com/embed/RigS9fOCxWo', 'https://miro.com/app/board/uXjVPx_saHM=/', 5),
        ('ცხრილები (Table)', 'r6-tables', 'HTML ცხრილების შექმნა და სტილიზაცია', 18, 'https://youtube.com/embed/VHdlP1_wKIA', 'https://miro.com/app/board/uXjVPuD4TOM=/', 6),
        ('ფორმები', 'r7-forms', 'HTML ფორმების შექმნა და ვალიდაცია', 24, 'https://youtube.com/embed/qMWuLAkjkMA', 'https://miro.com/app/board/uXjVPtgVav8=/', 7),
        ('სემანტიკური ტეგები და HTML-ის ვალიდაცია', 'r8-semantic-tags', 'სემანტიკური HTML და ვალიდაცია', 18, 'https://youtube.com/embed/_Jw0aqwwuTw', 'https://miro.com/app/board/uXjVPt2v948=/', 8)
) AS topic_data(name, slug, description, duration, theory_video, miro_link, order_index)
WHERE t.slug = 'html'
ON CONFLICT (technology_id, slug) DO NOTHING;

-- CSS Topics
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
WHERE t.slug = 'css'
ON CONFLICT (technology_id, slug) DO NOTHING;

-- UI/UX Basics Topics
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
WHERE t.slug = 'ui-ux-basics'
ON CONFLICT (technology_id, slug) DO NOTHING;

-- Figma Topics
INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
    t.id,
    topic_data.name,
    topic_data.slug,
    topic_data.description,
    topic_data.duration,
    topic_data.theory_video,
    topic_data.miro_link,
    topic_data.order_index
FROM technologies t
CROSS JOIN (
    VALUES
        ('როგორ გამოვიყენოთ Figma', 'd2-figma-basics', 'Figma-ს ინტერფეისი და გლობალური სტილები', 15, 'https://www.youtube.com/embed/Y7cBS4EbB2U', 'https://www.figma.com/file/txkoQAp4Y5zquZeXPM3rbM/', 1),
        ('Figma-ს ინტერფეისი (გაგრძელება)', 'd3-figma-interface', 'Figma-ს მოწინავე ფუნქციები', 15, 'https://www.youtube.com/embed/Y7cBS4EbB2U', 'https://www.figma.com/file/txkoQAp4Y5zquZeXPM3rbM/', 2),
        ('ავტომატური განლაგებები Figma-ში', 'd4-auto-layout', 'Auto Layout ფუნქციონალი', 19, NULL, 'https://www.figma.com/file/rHGS8arO6daIzTlouUcl45/', 3),
        ('კომპონენტები Figma-ში', 'd5-components', 'კომპონენტების შექმნა და გამოყენება', 19, 'https://www.youtube.com/embed/KuHceB318YU', 'https://www.figma.com/file/vGZAUg9ySxQYfVKF5N5Vym/', 4),
        ('პროტოტიპები და ინტერაქციები', 'd6-prototypes', 'პროტოტიპების შექმნა და ინტერაქტიული დიზაინი', 20, NULL, NULL, 5)
) AS topic_data(name, slug, description, duration, theory_video, miro_link, order_index)
WHERE t.slug = 'figma'
ON CONFLICT (technology_id, slug) DO NOTHING;

-- Verify results
SELECT 'Technologies' as type, COUNT(*) as count FROM technologies
UNION ALL
SELECT 'Topics' as type, COUNT(*) as count FROM topics;

-- Show what was inserted
SELECT
    c.name as course_name,
    t.name as technology_name,
    t.icon,
    COUNT(tp.id) as topic_count
FROM courses c
LEFT JOIN technologies t ON t.course_id = c.id
LEFT JOIN topics tp ON tp.technology_id = t.id
GROUP BY c.name, t.name, t.icon, t.order_index
ORDER BY c.name, t.order_index;
