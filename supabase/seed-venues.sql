-- 8 prémiových českých svatebních míst
-- Spusť po schema.sql v Supabase SQL editoru

-- Smaž ukázková data (pokud byla nahrazena dříve)
delete from venues where slug in (
  'zamek-hluboka','vinny-sklep-morava','hotel-ambassador-praha','statek-pod-duby'
);

insert into venues (slug, title, description, location, region, type, capacity, price_from, services, images, features, is_featured) values

-- 1. Chateau Mcely
('chateau-mcely',
 'Chateau Mcely',
 'Pětihvězdičkový boutique zámek se SPA, certifikovaný jako jeden z nejekologičtějších hotelů Evropy. Romantické prostředí v parku, vlastní vinařství, michelin-úrovňové menu. Pro páry, které hledají naprostou exkluzivitu nedaleko Prahy.',
 'Mcely, Středočeský kraj',
 'Středočeský',
 'Zámek',
 120,
 280000,
 ARRAY['Catering', 'Ubytování', 'SPA & Wellness', 'Fotograf', 'Dekorace', 'Hudba', 'Květinová výzdoba'],
 ARRAY[
   'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1600&q=85',
   'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1600&q=85',
   'https://images.unsplash.com/photo-1561489422-45f6fc4d48f9?w=1600&q=85'
 ],
 ARRAY['Vlastní park 25 ha', 'Bezbariérový přístup', 'Zahradní obřad', 'Privátní pronájem', 'Helikoptérová plocha', 'Ekologický provoz'],
 true),

-- 2. Zámek Loučeň
('zamek-loucen',
 'Zámek Loučeň',
 'Barokní zámek se třinácti labyrinty v zámeckém parku. Tradiční svatební místo s dlouhou historií, krásnou kaplí a zámeckým restaurantem. Atmosféra pohádky pro 50–250 hostů.',
 'Loučeň, Středočeský kraj',
 'Středočeský',
 'Zámek',
 250,
 180000,
 ARRAY['Catering', 'Ubytování', 'Dekorace', 'Fotograf', 'Hudba', 'Kaple pro obřad'],
 ARRAY[
   'https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=85',
   'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1600&q=85',
   'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=1600&q=85'
 ],
 ARRAY['13 labyrintů v parku', 'Zámecká kaple', 'Ubytování přímo na zámku', 'Parkování', 'Kočár pro novomanžele'],
 true),

-- 3. Vinařství Sonberk
('vinarstvi-sonberk',
 'Vinařství Sonberk',
 'Architektonicky oceňované vinařství u Popic. Moderní stavba zasazená do vinic, terasy s výhledem na Pavlovské vrchy. Premiérové moravské svatby s degustací vlastních vín.',
 'Popice u Mikulova, Jihomoravský kraj',
 'Jihomoravský',
 'Vinný sklep',
 100,
 95000,
 ARRAY['Catering', 'Degustace vín', 'Dekorace', 'DJ', 'Venkovní obřad'],
 ARRAY[
   'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1600&q=85',
   'https://images.unsplash.com/photo-1529636798458-92182e662485?w=1600&q=85',
   'https://images.unsplash.com/photo-1470158499416-75be9aa0c4db?w=1600&q=85'
 ],
 ARRAY['Vlastní vinice', 'Architektonická památka', 'Venkovní terasy', 'Degustační místnost', 'Výhled na Pálavu'],
 true),

-- 4. Hotel Augustine Praha
('hotel-augustine-praha',
 'The Augustine, Praha',
 'Pětihvězdičkový luxusní hotel v bývalém augustiniánském klášteře pod Pražským hradem. Historické prostory, klášterní zahrada, michelin restaurace. Pro svatby, které mají být událostí roku.',
 'Letenská, Praha 1 – Malá Strana',
 'Praha',
 'Hotel',
 180,
 320000,
 ARRAY['Catering', 'Ubytování', 'Dekorace', 'Fotograf', 'Video', 'SPA', 'Hudba', 'Květiny'],
 ARRAY[
   'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600&q=85',
   'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600&q=85',
   'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=85'
 ],
 ARRAY['Klášterní zahrada', 'Pohled na Hrad', 'Valet parking', 'SPA & Wellness', 'Michelin kuchyně', 'Klimatizace', 'Bezbariérový přístup'],
 true),

-- 5. Statek Lázeň
('statek-lazen',
 'Statek Lázeň',
 'Stylově zrekonstruovaný venkovský statek v jižních Čechách. Stodola pro 80 hostů, rozlehlá zahrada, ovocný sad. Ideální pro letní zahradní svatby s pohodovou rodinnou atmosférou.',
 'Lázeň u Tábora, Jihočeský kraj',
 'Jihočeský',
 'Venkovský statek',
 90,
 70000,
 ARRAY['Catering', 'Stany', 'Dekorace', 'Fotograf', 'BBQ'],
 ARRAY[
   'https://images.unsplash.com/photo-1505932794465-147d1f1b2c97?w=1600&q=85',
   'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1600&q=85',
   'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1600&q=85'
 ],
 ARRAY['Stodola s krovy', 'Ovocný sad', 'Dětský koutek', 'Volné parkování', 'Ubytování pro 40 hostů', 'Pet friendly'],
 false),

-- 6. Vila Tugendhat
('vila-tugendhat',
 'Vila Tugendhat',
 'Funkcionalistická památka UNESCO od Miese van der Rohe v Brně. Limitovaný počet svateb ročně. Pro páry, které milují architekturu a chtějí svatbu jako umělecké dílo.',
 'Černá Pole, Brno',
 'Jihomoravský',
 'Moderní prostor',
 60,
 220000,
 ARRAY['Catering', 'Dekorace', 'Fotograf', 'Hudba'],
 ARRAY[
   'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1600&q=85',
   'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=85'
 ],
 ARRAY['UNESCO památka', 'Funkcionalistická architektura', 'Zahrada s výhledem', 'Limitované svatby', 'Originální Mies van der Rohe interiér'],
 true),

-- 7. Zámek Hrubá Skála
('zamek-hruba-skala',
 'Zámek Hrubá Skála',
 'Romantický skalní zámek v Českém ráji obklopený pískovcovými skalami. Magické místo s panoramatickým výhledem, vlastní restaurací a možností obřadu pod širým nebem na věži.',
 'Hrubá Skála, Liberecký kraj',
 'Liberecký',
 'Zámek',
 130,
 110000,
 ARRAY['Catering', 'Ubytování', 'Dekorace', 'Fotograf', 'Hudba'],
 ARRAY[
   'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=85',
   'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1600&q=85',
   'https://images.unsplash.com/photo-1525772764200-be829a350797?w=1600&q=85'
 ],
 ARRAY['Český ráj', 'Skalní vyhlídková věž', 'Ubytování přímo v zámku', 'Hotel****', 'Restaurace', 'Parkování'],
 false),

-- 8. Stodola Plumlov
('stodola-plumlov',
 'Stará Stodola Plumlov',
 'Originálně přestavěná stará stodola s industriálním designem a moderními prvky. Velký prostor pro tanec, autentická atmosféra, fotograficky vděčné prostředí. Pro páry milující rustikální chic.',
 'Plumlov, Olomoucký kraj',
 'Olomoucký',
 'Historická budova',
 150,
 65000,
 ARRAY['Catering', 'Dekorace', 'DJ', 'Stany'],
 ARRAY[
   'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=1600&q=85',
   'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1600&q=85'
 ],
 ARRAY['Industriální design', 'Velký taneční prostor', 'Vlastní zahrada', 'Stodola s krovy', 'Ubytování v okolí'],
 false);
