-- 006_topics.sql
-- Adds two-level topic taxonomy for filtering discussions on the explore feed.
-- topics: hierarchical academic disciplines (parent_id nullable for top-level)
-- discussion_topics: many-to-many join between discussions and topics

CREATE TABLE topics (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  parent_id  UUID REFERENCES topics(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE discussion_topics (
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  topic_id      UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (discussion_id, topic_id)
);

CREATE INDEX idx_discussion_topics_topic_id      ON discussion_topics(topic_id);
CREATE INDEX idx_discussion_topics_discussion_id ON discussion_topics(discussion_id);

-- -----------------------------------------------------------------------
-- Seed top-level topics
-- -----------------------------------------------------------------------
INSERT INTO topics (name, slug) VALUES
  ('Life Sciences',                'life-sciences'),
  ('Physical Sciences',            'physical-sciences'),
  ('Social Sciences',              'social-sciences'),
  ('Humanities',                   'humanities'),
  ('Engineering & Technology',     'engineering-technology'),
  ('Medicine & Health',            'medicine-health'),
  ('Mathematics',                  'mathematics'),
  ('Earth & Environmental Sciences','earth-environmental-sciences'),
  ('Economics & Business',         'economics-business'),
  ('Computer Science & AI',        'computer-science-ai');

-- -----------------------------------------------------------------------
-- Seed sub-topics (parent_id resolved by slug lookup)
-- -----------------------------------------------------------------------

-- Life Sciences
INSERT INTO topics (name, slug, parent_id) SELECT 'Molecular Biology',    'molecular-biology',    id FROM topics WHERE slug = 'life-sciences';
INSERT INTO topics (name, slug, parent_id) SELECT 'Genetics',             'genetics',             id FROM topics WHERE slug = 'life-sciences';
INSERT INTO topics (name, slug, parent_id) SELECT 'Ecology',              'ecology',              id FROM topics WHERE slug = 'life-sciences';
INSERT INTO topics (name, slug, parent_id) SELECT 'Evolutionary Biology', 'evolutionary-biology', id FROM topics WHERE slug = 'life-sciences';
INSERT INTO topics (name, slug, parent_id) SELECT 'Neuroscience',         'neuroscience',         id FROM topics WHERE slug = 'life-sciences';
INSERT INTO topics (name, slug, parent_id) SELECT 'Cell Biology',         'cell-biology',         id FROM topics WHERE slug = 'life-sciences';

-- Physical Sciences
INSERT INTO topics (name, slug, parent_id) SELECT 'Physics',                  'physics',                   id FROM topics WHERE slug = 'physical-sciences';
INSERT INTO topics (name, slug, parent_id) SELECT 'Chemistry',                'chemistry',                 id FROM topics WHERE slug = 'physical-sciences';
INSERT INTO topics (name, slug, parent_id) SELECT 'Astronomy & Astrophysics', 'astronomy-astrophysics',    id FROM topics WHERE slug = 'physical-sciences';
INSERT INTO topics (name, slug, parent_id) SELECT 'Quantum Science',          'quantum-science',           id FROM topics WHERE slug = 'physical-sciences';
INSERT INTO topics (name, slug, parent_id) SELECT 'Materials Science',        'materials-science',         id FROM topics WHERE slug = 'physical-sciences';

-- Social Sciences
INSERT INTO topics (name, slug, parent_id) SELECT 'Psychology',       'psychology',       id FROM topics WHERE slug = 'social-sciences';
INSERT INTO topics (name, slug, parent_id) SELECT 'Sociology',        'sociology',        id FROM topics WHERE slug = 'social-sciences';
INSERT INTO topics (name, slug, parent_id) SELECT 'Political Science', 'political-science',id FROM topics WHERE slug = 'social-sciences';
INSERT INTO topics (name, slug, parent_id) SELECT 'Anthropology',     'anthropology',     id FROM topics WHERE slug = 'social-sciences';
INSERT INTO topics (name, slug, parent_id) SELECT 'Linguistics',      'linguistics',      id FROM topics WHERE slug = 'social-sciences';

-- Humanities
INSERT INTO topics (name, slug, parent_id) SELECT 'Philosophy',      'philosophy',      id FROM topics WHERE slug = 'humanities';
INSERT INTO topics (name, slug, parent_id) SELECT 'History',         'history',         id FROM topics WHERE slug = 'humanities';
INSERT INTO topics (name, slug, parent_id) SELECT 'Literature',      'literature',      id FROM topics WHERE slug = 'humanities';
INSERT INTO topics (name, slug, parent_id) SELECT 'Art History',     'art-history',     id FROM topics WHERE slug = 'humanities';
INSERT INTO topics (name, slug, parent_id) SELECT 'Religious Studies','religious-studies',id FROM topics WHERE slug = 'humanities';

-- Engineering & Technology
INSERT INTO topics (name, slug, parent_id) SELECT 'Electrical Engineering',  'electrical-engineering',  id FROM topics WHERE slug = 'engineering-technology';
INSERT INTO topics (name, slug, parent_id) SELECT 'Mechanical Engineering',  'mechanical-engineering',  id FROM topics WHERE slug = 'engineering-technology';
INSERT INTO topics (name, slug, parent_id) SELECT 'Civil Engineering',       'civil-engineering',       id FROM topics WHERE slug = 'engineering-technology';
INSERT INTO topics (name, slug, parent_id) SELECT 'Biomedical Engineering',  'biomedical-engineering',  id FROM topics WHERE slug = 'engineering-technology';
INSERT INTO topics (name, slug, parent_id) SELECT 'Robotics',                'robotics',                id FROM topics WHERE slug = 'engineering-technology';

-- Medicine & Health
INSERT INTO topics (name, slug, parent_id) SELECT 'Clinical Medicine', 'clinical-medicine', id FROM topics WHERE slug = 'medicine-health';
INSERT INTO topics (name, slug, parent_id) SELECT 'Public Health',     'public-health',     id FROM topics WHERE slug = 'medicine-health';
INSERT INTO topics (name, slug, parent_id) SELECT 'Pharmacology',      'pharmacology',      id FROM topics WHERE slug = 'medicine-health';
INSERT INTO topics (name, slug, parent_id) SELECT 'Epidemiology',      'epidemiology',      id FROM topics WHERE slug = 'medicine-health';
INSERT INTO topics (name, slug, parent_id) SELECT 'Immunology',        'immunology',        id FROM topics WHERE slug = 'medicine-health';

-- Mathematics
INSERT INTO topics (name, slug, parent_id) SELECT 'Pure Mathematics',         'pure-mathematics',         id FROM topics WHERE slug = 'mathematics';
INSERT INTO topics (name, slug, parent_id) SELECT 'Applied Mathematics',      'applied-mathematics',      id FROM topics WHERE slug = 'mathematics';
INSERT INTO topics (name, slug, parent_id) SELECT 'Statistics & Probability', 'statistics-probability',   id FROM topics WHERE slug = 'mathematics';
INSERT INTO topics (name, slug, parent_id) SELECT 'Computational Mathematics','computational-mathematics',id FROM topics WHERE slug = 'mathematics';

-- Earth & Environmental Sciences
INSERT INTO topics (name, slug, parent_id) SELECT 'Climate Science',       'climate-science',        id FROM topics WHERE slug = 'earth-environmental-sciences';
INSERT INTO topics (name, slug, parent_id) SELECT 'Geology',               'geology',                id FROM topics WHERE slug = 'earth-environmental-sciences';
INSERT INTO topics (name, slug, parent_id) SELECT 'Oceanography',          'oceanography',           id FROM topics WHERE slug = 'earth-environmental-sciences';
INSERT INTO topics (name, slug, parent_id) SELECT 'Atmospheric Science',   'atmospheric-science',    id FROM topics WHERE slug = 'earth-environmental-sciences';
INSERT INTO topics (name, slug, parent_id) SELECT 'Environmental Policy',  'environmental-policy',   id FROM topics WHERE slug = 'earth-environmental-sciences';

-- Economics & Business
INSERT INTO topics (name, slug, parent_id) SELECT 'Macroeconomics',      'macroeconomics',       id FROM topics WHERE slug = 'economics-business';
INSERT INTO topics (name, slug, parent_id) SELECT 'Microeconomics',      'microeconomics',       id FROM topics WHERE slug = 'economics-business';
INSERT INTO topics (name, slug, parent_id) SELECT 'Finance',             'finance',              id FROM topics WHERE slug = 'economics-business';
INSERT INTO topics (name, slug, parent_id) SELECT 'Behavioral Economics','behavioral-economics', id FROM topics WHERE slug = 'economics-business';
INSERT INTO topics (name, slug, parent_id) SELECT 'Management',          'management',           id FROM topics WHERE slug = 'economics-business';

-- Computer Science & AI
INSERT INTO topics (name, slug, parent_id) SELECT 'Artificial Intelligence',      'artificial-intelligence',      id FROM topics WHERE slug = 'computer-science-ai';
INSERT INTO topics (name, slug, parent_id) SELECT 'Machine Learning',             'machine-learning',             id FROM topics WHERE slug = 'computer-science-ai';
INSERT INTO topics (name, slug, parent_id) SELECT 'Systems & Networking',         'systems-networking',           id FROM topics WHERE slug = 'computer-science-ai';
INSERT INTO topics (name, slug, parent_id) SELECT 'Human-Computer Interaction',   'human-computer-interaction',   id FROM topics WHERE slug = 'computer-science-ai';
INSERT INTO topics (name, slug, parent_id) SELECT 'Cybersecurity',                'cybersecurity',                id FROM topics WHERE slug = 'computer-science-ai';
INSERT INTO topics (name, slug, parent_id) SELECT 'Programming Languages',        'programming-languages',        id FROM topics WHERE slug = 'computer-science-ai';