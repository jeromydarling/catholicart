-- Ars Sacra · reference data seed.
-- Apply after 0002_rls.sql.
--
-- Mirrors src/data/categories.ts, src/data/saints.ts, src/data/artist-tags.ts.
-- Idempotent (uses ON CONFLICT DO UPDATE).

-- ── categories ────────────────────────────────────────────────────
insert into public.categories (slug, name, short_name, blurb, palette_from, palette_to, sort_order) values
  ('iconography',        'Iconography',              'Iconography',     'Hand-written icons in egg tempera and gold leaf.',                '#d8c39a', '#7a5320',  1),
  ('sacred-painting',    'Sacred Painting',          'Painting',        'Oil and tempera in the Western Catholic tradition.',              '#a52f2f', '#3a0d0d',  2),
  ('sculpture',          'Sculpture',                'Sculpture',       'Wood, stone, bronze; the body that was carved.',                  '#8a5028', '#3a200a',  3),
  ('liturgical-textile', 'Liturgical Textiles',      'Textiles',        'Vestments, altar linens, banners in proper liturgical color.',    '#553c5e', '#1a0e25',  4),
  ('metalwork',          'Liturgical Metalwork',     'Metalwork',       'Chalices, ciboria, monstrances; the slow study of fire.',         '#5a4636', '#231914',  5),
  ('stained-glass-mosaic','Stained Glass & Mosaic',   'Glass & Mosaic',  'Tesserae and lead came; light made theology.',                    '#3a4d8f', '#0e1840',  6),
  ('illumination',       'Illuminated Manuscript',   'Illumination',    'Vellum, ink, gilding; the book made beautiful.',                  '#c79b3b', '#5e3e0e',  7),
  ('photography',        'Sacred Photography',       'Photography',     'Liturgy, vocation, pilgrimage; the lens as witness.',             '#3a3a3a', '#0d0d0d',  8),
  ('music',              'Sacred Music',             'Music',           'Composed for the liturgy; chant and polyphony commissioned.',     '#5d6f3d', '#1f2a11',  9)
on conflict (slug) do update set
  name = excluded.name, short_name = excluded.short_name, blurb = excluded.blurb,
  palette_from = excluded.palette_from, palette_to = excluded.palette_to, sort_order = excluded.sort_order;

-- ── saints ────────────────────────────────────────────────────────
insert into public.saints (slug, name, also, feast_month, feast_day, patron_of, blurb, palette_from, palette_to) values
  ('mary',            'Blessed Virgin Mary',         array['Mary','Theotokos','Our Lady','Madonna'],         1,  1, array['motherhood','the Church','the Americas'],           'Mother of God under many titles. Most-depicted of all sacred subjects.', '#3a4d8f', '#15214c'),
  ('joseph',          'St. Joseph',                  array['Joseph the Worker','Patron of the Universal Church'], 3, 19, array['fathers','workers','a happy death','the Universal Church'], 'Husband of Mary, foster father of Jesus, model of the silent and faithful man.', '#7a5320', '#3a230a'),
  ('michael',         'St. Michael the Archangel',   array['Michael','Archangel'],                          9, 29, array['soldiers','police','those in spiritual combat'],    'The captain of the heavenly host. Defender against the powers of darkness.', '#7e1414', '#2c0606'),
  ('patrick',         'St. Patrick of Ireland',      array['Patrick'],                                       3, 17, array['Ireland','engineers','exiles'],                     'Bishop, missionary, slave-turned-evangelist who brought the Gospel to Ireland.', '#3f6c44', '#1a2e1d'),
  ('francis',         'St. Francis of Assisi',       array['Francis'],                                      10,  4, array['the poor','ecology','Italy','animals'],             'Stigmatic, founder of the Friars Minor. Preached to the birds; rebuilt the Church.', '#a07943', '#4a3517'),
  ('therese',         'St. Thérèse of Lisieux',      array['Thérèse','Therese','Little Flower'],            10,  1, array['missions','the sick','the small'],                  'Doctor of the Church. The Little Way: ordinary love as the path to holiness.', '#c87f8c', '#5a2f3a'),
  ('augustine',       'St. Augustine of Hippo',      array['Augustine'],                                     8, 28, array['theologians','converts','those with restless hearts'], 'Bishop, Doctor of the Church, author of the Confessions.', '#7d3a3a', '#2e1212'),
  ('thomas-aquinas',  'St. Thomas Aquinas',          array['Aquinas','the Angelic Doctor'],                  1, 28, array['students','universities','philosophers'],           'Dominican friar and Doctor of the Church. Wedded reason to revelation.', '#3a3f6e', '#13162e'),
  ('jpii',            'St. John Paul II',            array['John Paul II','Karol Wojtyła'],                 10, 22, array['families','the youth','World Youth Day'],           'The Polish Pope. Author of the Letter to Artists.', '#c79b3b', '#5e3e0e'),
  ('faustina',        'St. Faustina Kowalska',       array['Faustina','Sr. Faustina'],                      10,  5, array['mercy','the dying'],                                'The secretary of Divine Mercy. Saw Jesus and recorded his words for our age.', '#e8e9ed', '#9caac4'),
  ('john-vianney',    'St. John Vianney',            array['Vianney','Curé d''Ars','Cure of Ars'],           8,  4, array['parish priests'],                                   'The Curé of Ars. Patron of parish priests; lived in the confessional.', '#3a3a3a', '#0d0d0d'),
  ('padre-pio',       'St. Padre Pio',               array['Padre Pio','Pio of Pietrelcina'],                9, 23, array['civil defense','stress relief','adolescents'],      'Capuchin friar, stigmatic, confessor of nations.', '#5a4636', '#231914'),
  ('kolbe',           'St. Maximilian Kolbe',        array['Kolbe','Maximilian'],                            8, 14, array['prisoners','journalists','pro-life movement'],      'Polish Conventual Franciscan. Died in place of another at Auschwitz.', '#3e3a52', '#15101e'),
  ('anthony',         'St. Anthony of Padua',        array['Anthony','Padua'],                               6, 13, array['lost things','the poor','Portugal'],                'Doctor of the Church. Hammer of heretics; herald of the lost.', '#7c5a32', '#33240f'),
  ('cecilia',         'St. Cecilia',                 array['Cecilia'],                                      11, 22, array['music','musicians','composers'],                    'Roman virgin and martyr. Patroness of sacred music.', '#a3506b', '#3e1a26'),
  ('catherine-siena', 'St. Catherine of Siena',      array['Catherine','Siena'],                             4, 29, array['Europe','nurses','those struggling with their faith'], 'Mystic, Doctor of the Church, who told popes the truth.', '#5b3a72', '#1f1131'),
  ('bernadette',      'St. Bernadette of Lourdes',   array['Bernadette','Lourdes'],                          4, 16, array['the sick','the poor','those mocked for piety'],     'Visionary of Lourdes. "I am the Immaculate Conception."', '#9aaad3', '#39456b'),
  ('john-baptist',    'St. John the Baptist',        array['John the Baptist','Forerunner'],                 6, 24, array['preachers','tailors','converts'],                   'Forerunner of the Lord. "He must increase; I must decrease."', '#7a4f1f', '#2e1c0a'),
  ('peter-paul',      'Sts. Peter & Paul',           array['Peter','Paul','Peter and Paul'],                 6, 29, array['the Universal Church','Rome','missionaries'],       'The two pillars of the Apostolic Church.', '#a8721e', '#3f2a0a'),
  ('guadalupe',       'Our Lady of Guadalupe',       array['Guadalupe','Tepeyac'],                          12, 12, array['the Americas','the unborn'],                        'The Mestiza Virgin who appeared at Tepeyac in 1531. Mother of the New World.', '#2e6b6b', '#0e2929')
on conflict (slug) do update set
  name = excluded.name, also = excluded.also,
  feast_month = excluded.feast_month, feast_day = excluded.feast_day,
  patron_of = excluded.patron_of, blurb = excluded.blurb,
  palette_from = excluded.palette_from, palette_to = excluded.palette_to;

-- ── dioceses (cathedral coordinates: lon, lat) ──────────────────────
insert into public.dioceses (name, longitude, latitude) values
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
  ('Archdiocese of Granada',                          -3.5986,  37.1773)
on conflict (name) do update set
  longitude = excluded.longitude, latitude = excluded.latitude;

-- ── religious orders ────────────────────────────────────────────────
insert into public.religious_orders (slug, name, charism, palette_from, palette_to) values
  ('benedictine',        'Order of St. Benedict',             'Ora et labora — pray and work. The grandfather of monastic art and chant.',  '#3a352c', '#0e0c08'),
  ('franciscan',         'Franciscans',                        'Lady Poverty and the cosmic Christ. Workshops of the people.',                '#7a5320', '#33240f'),
  ('dominican',          'Order of Preachers (Dominicans)',    'Truth in the streets. The white-and-black habit and the studied hand.',       '#3a3a3a', '#0a0a0a'),
  ('discalced-carmelite','Discalced Carmelites',               'Hidden contemplation, dazzling output. Teresa, John of the Cross, Thérèse.', '#5a4636', '#231914')
on conflict (slug) do update set
  name = excluded.name, charism = excluded.charism,
  palette_from = excluded.palette_from, palette_to = excluded.palette_to;
