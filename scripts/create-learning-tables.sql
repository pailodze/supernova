-- Create technologies table (modules within a course, e.g., HTML, CSS, Figma)
CREATE TABLE IF NOT EXISTS technologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, slug)
);

-- Create topics table (individual lessons within a technology)
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technology_id UUID NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  duration INTEGER DEFAULT 0, -- duration in minutes
  theory_video VARCHAR(500),
  miro_link TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(technology_id, slug)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_technologies_course_id ON technologies(course_id);
CREATE INDEX IF NOT EXISTS idx_technologies_order ON technologies(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_topics_technology_id ON topics(technology_id);
CREATE INDEX IF NOT EXISTS idx_topics_order ON topics(technology_id, order_index);

-- Enable RLS
ALTER TABLE technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for technologies
CREATE POLICY "Technologies are viewable by everyone" ON technologies
  FOR SELECT USING (true);

CREATE POLICY "Technologies are manageable by admins" ON technologies
  FOR ALL USING (true);

-- RLS Policies for topics
CREATE POLICY "Topics are viewable by everyone" ON topics
  FOR SELECT USING (true);

CREATE POLICY "Topics are manageable by admins" ON topics
  FOR ALL USING (true);

-- Insert sample data based on novatori.sql

-- First, we need to get course IDs
-- Assuming courses already exist with these slugs: 'react-frontend', 'ui-ux-design', 'english-basic', 'english-convo'

-- For React Frontend course - Create technologies (modules)
INSERT INTO technologies (course_id, name, slug, description, icon, order_index)
SELECT
  id,
  'HTML',
  'html',
  'HTML საფუძვლები - როგორ წავიკითხოთ და ვწეროთ HTML დოკუმენტები',
  '🌐',
  1
FROM courses WHERE slug = 'react-frontend'
ON CONFLICT (course_id, slug) DO NOTHING;

INSERT INTO technologies (course_id, name, slug, description, icon, order_index)
SELECT
  id,
  'CSS',
  'css',
  'CSS საფუძვლები - სტილების გამოყენება ვებ გვერდებზე',
  '🎨',
  2
FROM courses WHERE slug = 'react-frontend'
ON CONFLICT (course_id, slug) DO NOTHING;

-- For UI/UX Design course - Create technologies
INSERT INTO technologies (course_id, name, slug, description, icon, order_index)
SELECT
  id,
  'UI/UX საფუძვლები',
  'ui-ux-basics',
  'შესავალი UI/UX დიზაინში',
  '✨',
  1
FROM courses WHERE slug = 'ui-ux-design'
ON CONFLICT (course_id, slug) DO NOTHING;

INSERT INTO technologies (course_id, name, slug, description, icon, order_index)
SELECT
  id,
  'Figma',
  'figma',
  'Figma-ს გამოყენება UI დიზაინისთვის',
  '🎯',
  2
FROM courses WHERE slug = 'ui-ux-design'
ON CONFLICT (course_id, slug) DO NOTHING;

-- Insert topics for HTML technology
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
JOIN courses c ON t.course_id = c.id
WHERE c.slug = 'react-frontend' AND t.slug = 'html'
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
JOIN courses c ON t.course_id = c.id
WHERE c.slug = 'react-frontend' AND t.slug = 'html'
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
JOIN courses c ON t.course_id = c.id
WHERE c.slug = 'react-frontend' AND t.slug = 'html'
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
JOIN courses c ON t.course_id = c.id
WHERE c.slug = 'react-frontend' AND t.slug = 'html'
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
JOIN courses c ON t.course_id = c.id
WHERE c.slug = 'react-frontend' AND t.slug = 'html'
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
JOIN courses c ON t.course_id = c.id
WHERE c.slug = 'react-frontend' AND t.slug = 'html'
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
JOIN courses c ON t.course_id = c.id
WHERE c.slug = 'react-frontend' AND t.slug = 'html'
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
JOIN courses c ON t.course_id = c.id
WHERE c.slug = 'react-frontend' AND t.slug = 'html'
ON CONFLICT (technology_id, slug) DO NOTHING;

-- Insert topics for CSS technology
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
JOIN courses c ON t.course_id = c.id
WHERE c.slug = 'react-frontend' AND t.slug = 'css'
ON CONFLICT (technology_id, slug) DO NOTHING;

-- Insert topics for UI/UX Basics technology
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
JOIN courses c ON t.course_id = c.id
WHERE c.slug = 'ui-ux-design' AND t.slug = 'ui-ux-basics'
ON CONFLICT (technology_id, slug) DO NOTHING;

-- Insert topics for Figma technology
INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
  t.id,
  'როგორ გამოვიყენოთ Figma',
  'd2-figma-basics',
  'Figma-ს ინტერფეისი და გლობალური სტილები',
  15,
  'https://www.youtube.com/watch?v=Y7cBS4EbB2U',
  'https://www.figma.com/file/txkoQAp4Y5zquZeXPM3rbM/',
  1
FROM technologies t
JOIN courses c ON t.course_id = c.id
WHERE c.slug = 'ui-ux-design' AND t.slug = 'figma'
ON CONFLICT (technology_id, slug) DO NOTHING;

INSERT INTO topics (technology_id, name, slug, description, duration, theory_video, miro_link, order_index)
SELECT
  t.id,
  'Figma-ს ინტერფეისი (გაგრძელება)',
  'd3-figma-interface',
  'Figma-ს მოწინავე ფუნქციები',
  15,
  'https://youtu.be/Y7cBS4EbB2U',
  'https://www.figma.com/file/txkoQAp4Y5zquZeXPM3rbM/',
  2
FROM technologies t
JOIN courses c ON t.course_id = c.id
WHERE c.slug = 'ui-ux-design' AND t.slug = 'figma'
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
JOIN courses c ON t.course_id = c.id
WHERE c.slug = 'ui-ux-design' AND t.slug = 'figma'
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
JOIN courses c ON t.course_id = c.id
WHERE c.slug = 'ui-ux-design' AND t.slug = 'figma'
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
JOIN courses c ON t.course_id = c.id
WHERE c.slug = 'ui-ux-design' AND t.slug = 'figma'
ON CONFLICT (technology_id, slug) DO NOTHING;
