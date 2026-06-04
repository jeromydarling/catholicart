-- Ars Sacra · D1 reference data seed
-- Idempotent (uses INSERT OR REPLACE).

-- ── categories ──────────────────────────────────────────────────────
INSERT OR REPLACE INTO categories (slug, name, short_name, blurb, palette_from, palette_to, sort_order) VALUES
  ('iconography',         'Iconography',            'Iconography',    'Hand-written icons in egg tempera and gold leaf.',           '#d8c39a', '#7a5320',  1),
  ('sacred-painting',     'Sacred Painting',        'Painting',       'Oil and tempera in the Western Catholic tradition.',         '#a52f2f', '#3a0d0d',  2),
  ('sculpture',           'Sculpture',              'Sculpture',      'Wood, stone, bronze; the body that was carved.',             '#8a5028', '#3a200a',  3),
  ('liturgical-textile',  'Liturgical Textiles',    'Textiles',       'Vestments, altar linens, banners in proper liturgical color.','#553c5e', '#1a0e25',  4),
  ('metalwork',           'Liturgical Metalwork',   'Metalwork',      'Chalices, ciboria, monstrances; the slow study of fire.',    '#5a4636', '#231914',  5),
  ('stained-glass-mosaic','Stained Glass & Mosaic', 'Glass & Mosaic', 'Tesserae and lead came; light made theology.',               '#3a4d8f', '#0e1840',  6),
  ('illumination',        'Illuminated Manuscript', 'Illumination',   'Vellum, ink, gilding; the book made beautiful.',             '#c79b3b', '#5e3e0e',  7),
  ('photography',         'Sacred Photography',     'Photography',    'Liturgy, vocation, pilgrimage; the lens as witness.',        '#3a3a3a', '#0d0d0d',  8),
  ('music',               'Sacred Music',           'Music',          'Composed for the liturgy; chant and polyphony commissioned.','#5d6f3d', '#1f2a11',  9);

-- ── saints ──────────────────────────────────────────────────────────
INSERT OR REPLACE INTO saints (slug, name, also, feast_month, feast_day, patron_of, blurb, palette_from, palette_to) VALUES
  ('mary',            'Blessed Virgin Mary',         '["Mary","Theotokos","Our Lady","Madonna"]',                         1,  1, '["motherhood","the Church","the Americas"]',                   'Mother of God under many titles. Most-depicted of all sacred subjects.', '#3a4d8f', '#15214c'),
  ('joseph',          'St. Joseph',                  '["Joseph the Worker","Patron of the Universal Church"]',            3, 19, '["fathers","workers","a happy death","the Universal Church"]', 'Husband of Mary, foster father of Jesus, model of the silent and faithful man.', '#7a5320', '#3a230a'),
  ('michael',         'St. Michael the Archangel',   '["Michael","Archangel"]',                                            9, 29, '["soldiers","police","those in spiritual combat"]',           'The captain of the heavenly host. Defender against the powers of darkness.', '#7e1414', '#2c0606'),
  ('patrick',         'St. Patrick of Ireland',      '["Patrick"]',                                                        3, 17, '["Ireland","engineers","exiles"]',                            'Bishop, missionary, slave-turned-evangelist who brought the Gospel to Ireland.', '#3f6c44', '#1a2e1d'),
  ('francis',         'St. Francis of Assisi',       '["Francis"]',                                                       10,  4, '["the poor","ecology","Italy","animals"]',                    'Stigmatic, founder of the Friars Minor. Preached to the birds; rebuilt the Church.', '#a07943', '#4a3517'),
  ('therese',         'St. Therese of Lisieux',      '["Therese","Little Flower"]',                                       10,  1, '["missions","the sick","the small"]',                         'Doctor of the Church. The Little Way.', '#c87f8c', '#5a2f3a'),
  ('augustine',       'St. Augustine of Hippo',      '["Augustine"]',                                                      8, 28, '["theologians","converts"]',                                  'Bishop, Doctor of the Church, author of the Confessions.', '#7d3a3a', '#2e1212'),
  ('thomas-aquinas',  'St. Thomas Aquinas',          '["Aquinas","the Angelic Doctor"]',                                   1, 28, '["students","universities","philosophers"]',                  'Dominican friar and Doctor of the Church.', '#3a3f6e', '#13162e'),
  ('jpii',            'St. John Paul II',            '["John Paul II","Karol Wojtyla"]',                                  10, 22, '["families","the youth"]',                                    'The Polish Pope.', '#c79b3b', '#5e3e0e'),
  ('faustina',        'St. Faustina Kowalska',       '["Faustina","Sr. Faustina"]',                                       10,  5, '["mercy","the dying"]',                                       'The secretary of Divine Mercy.', '#e8e9ed', '#9caac4'),
  ('john-vianney',    'St. John Vianney',            '["Vianney","Cure dArs"]',                                            8,  4, '["parish priests"]',                                          'The Cure of Ars.', '#3a3a3a', '#0d0d0d'),
  ('padre-pio',       'St. Padre Pio',               '["Padre Pio","Pio of Pietrelcina"]',                                 9, 23, '["civil defense","stress relief","adolescents"]',             'Capuchin friar, stigmatic, confessor of nations.', '#5a4636', '#231914'),
  ('kolbe',           'St. Maximilian Kolbe',        '["Kolbe","Maximilian"]',                                             8, 14, '["prisoners","journalists","pro-life movement"]',             'Polish Conventual Franciscan. Died in place of another at Auschwitz.', '#3e3a52', '#15101e'),
  ('anthony',         'St. Anthony of Padua',        '["Anthony","Padua"]',                                                6, 13, '["lost things","the poor","Portugal"]',                       'Doctor of the Church.', '#7c5a32', '#33240f'),
  ('cecilia',         'St. Cecilia',                 '["Cecilia"]',                                                       11, 22, '["music","musicians","composers"]',                           'Roman virgin and martyr. Patroness of sacred music.', '#a3506b', '#3e1a26'),
  ('catherine-siena', 'St. Catherine of Siena',      '["Catherine","Siena"]',                                              4, 29, '["Europe","nurses"]',                                         'Mystic, Doctor of the Church.', '#5b3a72', '#1f1131'),
  ('bernadette',      'St. Bernadette of Lourdes',   '["Bernadette","Lourdes"]',                                           4, 16, '["the sick","the poor"]',                                     'Visionary of Lourdes.', '#9aaad3', '#39456b'),
  ('john-baptist',    'St. John the Baptist',        '["John the Baptist","Forerunner"]',                                  6, 24, '["preachers","tailors","converts"]',                          'Forerunner of the Lord.', '#7a4f1f', '#2e1c0a'),
  ('peter-paul',      'Sts. Peter & Paul',           '["Peter","Paul","Peter and Paul"]',                                  6, 29, '["the Universal Church","Rome","missionaries"]',              'The two pillars of the Apostolic Church.', '#a8721e', '#3f2a0a'),
  ('guadalupe',       'Our Lady of Guadalupe',       '["Guadalupe","Tepeyac"]',                                           12, 12, '["the Americas","the unborn"]',                               'The Mestiza Virgin who appeared at Tepeyac in 1531.', '#2e6b6b', '#0e2929');

-- ── dioceses (cathedral coordinates) ────────────────────────────────
INSERT OR REPLACE INTO dioceses (name, longitude, latitude) VALUES
  ('Diocese of Pittsburgh',                          -79.9959,  40.4406),
  ('Diocese of Tivoli',                               12.7991,  41.9658),
  ('Archdiocese of Mexico',                          -99.1332,  19.4326),
  ('Diocese of Plymouth',                             -4.1427,  50.3755),
  ('Archdiocese of Seoul',                           126.9779,  37.5663),
  ('Diocese of Galway, Kilmacduagh & Kilfenora',      -9.0568,  53.2707),
  ('Archdiocese of Olinda and Recife',               -34.8829,  -8.0578),
  ('Archdiocese of Santa Fe',                       -105.9378,  35.6870),
  ('Diocese of Oslo',                                 10.7522,  59.9139),
  ('Archdiocese of Lyon',                              4.8357,  45.7640),
  ('Archdiocese of St Andrews & Edinburgh',           -3.1883,  55.9533),
  ('Archdiocese of Granada',                          -3.5986,  37.1773);

-- ── religious orders ────────────────────────────────────────────────
INSERT OR REPLACE INTO religious_orders (slug, name, charism, palette_from, palette_to) VALUES
  ('benedictine',         'Order of St. Benedict',            'Ora et labora — pray and work.',                                        '#3a352c', '#0e0c08'),
  ('franciscan',          'Franciscans',                       'Lady Poverty and the cosmic Christ.',                                   '#7a5320', '#33240f'),
  ('dominican',           'Order of Preachers (Dominicans)',   'Truth in the streets.',                                                 '#3a3a3a', '#0a0a0a'),
  ('discalced-carmelite', 'Discalced Carmelites',              'Hidden contemplation, dazzling output.',                                '#5a4636', '#231914');
