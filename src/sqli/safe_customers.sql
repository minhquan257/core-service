-- ============================================================
--  Safe table: safe_customers
--  Security improvements over the vulnerable customers table:
--    1. UUID primary key  → no sequential ID enumeration
--    2. password_hash     → stores bcrypt hash, never plaintext
--    3. UNIQUE username   → enforced at DB level
--    4. Column lengths    → constrained to reject oversized input
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- for gen_random_uuid() on PG < 13

CREATE TABLE IF NOT EXISTS safe_customers (
  customer_id   UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  contact_name  VARCHAR(255),
  address       VARCHAR(255),
  city          VARCHAR(100),
  postal_code   VARCHAR(20),
  country       VARCHAR(100),
  password_hash VARCHAR(255) NOT NULL,  -- bcrypt hash only, never plaintext
  username      VARCHAR(100) NOT NULL,
  CONSTRAINT safe_customers_username_key UNIQUE (username)
);

-- ============================================================
--  Safe seed data — all 91 rows from dataset.csv
--  Passwords are hashed at INSERT time using pgcrypto crypt().
--  bcrypt cost=10 balances security and seed-script speed.
--  Plaintext passwords from the original dataset are passed
--  directly to crypt() and never stored in the file as hashes.
-- ============================================================

INSERT INTO safe_customers
  (customer_name, contact_name, address, city, postal_code, country, password_hash, username)
VALUES
  ('Alfreds Futterkiste','Maria Anders','Obere Str. 57','Berlin','12209','Germany',crypt('mariaanders40',gen_salt('bf',10)),'mariaanders'),
  ('Ana Trujillo Emparedados y helados','Ana Trujillo','Avda. de la Constitucion 2222','Mexico D.F.','05021','Mexico',crypt('anatrujillo10',gen_salt('bf',10)),'anatrujillo'),
  ('Antonio Moreno Taquera','Antonio Moreno','Mataderos 2312','Mexico D.F.','05023','Mexico',crypt('antoniomoreno2',gen_salt('bf',10)),'antoniomoreno'),
  ('Around the Horn','Thomas Hardy','120 Hanover Sq.','London','WA1 1DP','UK',crypt('thomashardy66',gen_salt('bf',10)),'thomashardy'),
  ('Berglunds snabbkoep','Christina Berglund','Berguvsvegen 8','Lulea','S-958 22','Sweden',crypt('christinaberglund57',gen_salt('bf',10)),'christinaberglund'),
  ('Blauer See Delikatessen','Hanna Moos','Forsterstr. 57','Mannheim','68306','Germany',crypt('hannamoos73',gen_salt('bf',10)),'hannamoos'),
  ('Blondel pere et fils','Frederique Citeaux','24, place Kleber','Strasbourg','67000','France',crypt('frederiqueciteaux46',gen_salt('bf',10)),'frederiqueciteaux'),
  ('Bolido Comidas preparadas','Martin Sommer','C/ Araquil, 67','Madrid','28023','Spain',crypt('martinsommer63',gen_salt('bf',10)),'martinsommer'),
  ('Bon app','Laurence Lebihans','12, rue des Bouchers','Marseille','13008','France',crypt('laurencelebihans54',gen_salt('bf',10)),'laurencelebihans'),
  ('Bottom-Dollar Marketse','Elizabeth Lincoln','23 Tsawassen Blvd.','Tsawassen','T2F 8M4','Canada',crypt('elizabethlincoln69',gen_salt('bf',10)),'elizabethlincoln'),
  ('Bs Beverages','Victoria Ashworth','Fauntleroy Circus','London','EC2 5NT','UK',crypt('victoriaashworth24',gen_salt('bf',10)),'victoriaashworth'),
  ('Cactus Comidas para llevar','Patricio Simpson','Cerrito 333','Buenos Aires','1010','Argentina',crypt('patriciosimpson15',gen_salt('bf',10)),'patriciosimpson'),
  ('Centro comercial Moctezuma','Francisco Chang','Sierras de Granada 9993','Mexico D.F.','05022','Mexico',crypt('franciscochang18',gen_salt('bf',10)),'franciscochang'),
  ('Chop-suey Chinese','Yang Wang','Hauptstr. 29','Bern','3012','Switzerland',crypt('yangwang77',gen_salt('bf',10)),'yangwang'),
  ('Comercio Mineiro','Pedro Afonso','Av. dos Lusiadas, 23','Sao Paulo','05432-043','Brazil',crypt('pedroafonso80',gen_salt('bf',10)),'pedroafonso'),
  ('Consolidated Holdings','Elizabeth Brown','Berkeley Gardens 12 Brewery','London','WX1 6LT','UK',crypt('elizabethbrown61',gen_salt('bf',10)),'elizabethbrown'),
  ('Drachenblut Delikatessend','Sven Ottlieb','Walserweg 21','Aachen','52066','Germany',crypt('svenottlieb41',gen_salt('bf',10)),'svenottlieb'),
  ('Du monde entier','Janine Labrune','67, rue des Cinquante Otages','Nantes','44000','France',crypt('janinelabrune44',gen_salt('bf',10)),'janinelabrune'),
  ('Eastern Connection','Ann Devon','35 King George','London','WX3 6FW','UK',crypt('anndevon71',gen_salt('bf',10)),'anndevon'),
  ('Ernst Handel','Roland Mendel','Kirchgasse 6','Graz','8010','Austria',crypt('rolandmendel84',gen_salt('bf',10)),'rolandmendel'),
  ('Familia Arquibaldo','Aria Cruz','Rua Oros, 92','Sao Paulo','05442-030','Brazil',crypt('ariacruz7',gen_salt('bf',10)),'ariacruz'),
  ('FISSA Fabrica Inter. Salchichas S.A.','Diego Roel','C/ Moralzarzal, 86','Madrid','28034','Spain',crypt('diegoroel5',gen_salt('bf',10)),'diegoroel'),
  ('Folies gourmandes','Martine Rance','184, chaussee de Tournai','Lille','59000','France',crypt('martinerance90',gen_salt('bf',10)),'martinerance'),
  ('Folk och fe HB','Maria Larsson','Akergatan 24','Brecke','S-844 67','Sweden',crypt('marialarsson35',gen_salt('bf',10)),'marialarsson'),
  ('Frankenversand','Peter Franken','Berliner Platz 43','Munchen','80805','Germany',crypt('peterfranken29',gen_salt('bf',10)),'peterfranken'),
  ('France restauration','Carine Schmitt','54, rue Royale','Nantes','44000','France',crypt('carineschmitt62',gen_salt('bf',10)),'carineschmitt'),
  ('Franchi S.p.A.','Paolo Accorti','Via Monte Bianco 34','Torino','10100','Italy',crypt('paoloaccorti23',gen_salt('bf',10)),'paoloaccorti'),
  ('Furia Bacalhau e Frutos do Mar','Lino Rodriguez','Jardim das rosas n. 32','Lisboa','1675','Portugal',crypt('linorodriguez33',gen_salt('bf',10)),'linorodriguez'),
  ('Galeria del gastronomo','Eduardo Saavedra','Rambla de Cataluna, 23','Barcelona','08022','Spain',crypt('eduardosaavedra27',gen_salt('bf',10)),'eduardosaavedra'),
  ('Godos Cocina Tipica','Jose Pedro Freyre','C/ Romero, 33','Sevilla','41101','Spain',crypt('josepedrofreyre86',gen_salt('bf',10)),'josepedrofreyre'),
  ('Gourmet Lanchonetes','Andre Fonseca','Av. Brasil, 442','Campinas','04876-786','Brazil',crypt('andrefonseca47',gen_salt('bf',10)),'andrefonseca'),
  ('Great Lakes Food Market','Howard Snyder','2732 Baker Blvd.','Eugene','97403','USA',crypt('howardsnyder97',gen_salt('bf',10)),'howardsnyder'),
  ('GROSELLA-Restaurante','Manuel Pereira','5th Ave. Los Palos Grandes','Caracas','1081','Venezuela',crypt('manuelpereira19',gen_salt('bf',10)),'manuelpereira'),
  ('Hanari Carnes','Mario Pontes','Rua do Paco, 67','Rio de Janeiro','05454-876','Brazil',crypt('mariopontes4',gen_salt('bf',10)),'mariopontes'),
  ('HILARION-Abastos','Carlos Hernandez','Carrera 22 con Ave. Carlos Soublette #8-35','San Cristobal','5022','Venezuela',crypt('carloshernandez34',gen_salt('bf',10)),'carloshernandez'),
  ('Hungry Coyote Import Store','Yoshi Latimer','City Center Plaza 516 Main St.','Elgin','97827','USA',crypt('yoshilatimer88',gen_salt('bf',10)),'yoshilatimer'),
  ('Hungry Owl All-Night Grocers','Patricia McKenna','8 Johnstown Road','Cork',NULL,'Ireland',crypt('patriciamckenna96',gen_salt('bf',10)),'patriciamckenna'),
  ('Island Trading','Helen Bennett','Garden House Crowther Way','Cowes','PO31 7PJ','UK',crypt('helenbennett61',gen_salt('bf',10)),'helenbennett'),
  ('Koniglich Essen','Philip Cramer','Maubelstr. 90','Brandenburg','14776','Germany',crypt('philipcramer12',gen_salt('bf',10)),'philipcramer'),
  ('La corne d abondance','Daniel Tonini','67, avenue de l Europe','Versailles','78000','France',crypt('danieltonini57',gen_salt('bf',10)),'danieltonini'),
  ('La maison d Asie','Annette Roulet','1 rue Alsace-Lorraine','Toulouse','31000','France',crypt('annetteroulet26',gen_salt('bf',10)),'annetteroulet'),
  ('Laughing Bacchus Wine Cellars','Yoshi Tannamuri','1900 Oak St.','Vancouver','V3F 2K1','Canada',crypt('yoshitannamuri13',gen_salt('bf',10)),'yoshitannamuri'),
  ('Lazy K Kountry Store','John Steel','12 Orchestra Terrace','Walla Walla','99362','USA',crypt('johnsteel79',gen_salt('bf',10)),'johnsteel'),
  ('Lehmanns Marktstand','Renate Messner','Magazinweg 7','Frankfurt a.M.','60528','Germany',crypt('renatemessner71',gen_salt('bf',10)),'renatemessner'),
  ('Lets Stop N Shop','Jaime Yorres','87 Polk St. Suite 5','San Francisco','94117','USA',crypt('jaimeyorres35',gen_salt('bf',10)),'jaimeyorres'),
  ('LILA-Supermercado','Carlos Gonzalez','Carrera 52 con Ave. Bolivar #65-98 Llano Largo','Barquisimeto','3508','Venezuela',crypt('carlosgonzalez36',gen_salt('bf',10)),'carlosgonzalez'),
  ('LINO-Delicateses','Felipe Izquierdo','Ave. 5 de Mayo Porlamar','I. de Margarita','4980','Venezuela',crypt('felipeizquierdo29',gen_salt('bf',10)),'felipeizquierdo'),
  ('Lonesome Pine Restaurant','Fran Wilson','89 Chiaroscuro Rd.','Portland','97219','USA',crypt('franwilson77',gen_salt('bf',10)),'franwilson'),
  ('Magazzini Alimentari Riuniti','Giovanni Rovelli','Via Ludovico il Moro 22','Bergamo','24100','Italy',crypt('giovannirovelli29',gen_salt('bf',10)),'giovannirovelli'),
  ('Maison Dewey','Catherine Dewey','Rue Joseph-Bens 532','Bruxelles','B-1180','Belgium',crypt('catherinedewey98',gen_salt('bf',10)),'catherinedewey'),
  ('Mere Paillarde','Jean Fresniere','43 rue St. Laurent','Montreal','H1J 1C3','Canada',crypt('jeanfresniere7',gen_salt('bf',10)),'jeanfresniere'),
  ('Morgenstern Gesundkost','Alexander Feuer','Heerstr. 22','Leipzig','04179','Germany',crypt('alexanderfeuer61',gen_salt('bf',10)),'alexanderfeuer'),
  ('North/South','Simon Crowther','South House 300 Queensbridge','London','SW7 1RZ','UK',crypt('simoncrowther85',gen_salt('bf',10)),'simoncrowther'),
  ('Oceano Atlantico Ltda.','Yvonne Moncada','Ing. Gustavo Moncada 8585 Piso 20-A','Buenos Aires','1010','Argentina',crypt('yvonnemoncada1',gen_salt('bf',10)),'yvonnemoncada'),
  ('Old World Delicatessen','Rene Phillips','2743 Bering St.','Anchorage','99508','USA',crypt('renephillips54',gen_salt('bf',10)),'renephillips'),
  ('Ottilies Keseladen','Henriette Pfalzheim','Mehrheimerstr. 369','Koln','50739','Germany',crypt('henriettepfalzheim22',gen_salt('bf',10)),'henriettepfalzheim'),
  ('Paris specialites','Marie Bertrand','265, boulevard Charonne','Paris','75012','France',crypt('mariebertrand58',gen_salt('bf',10)),'mariebertrand'),
  ('Pericles Comidas clasicas','Guillermo Fernandez','Calle Dr. Jorge Cash 321','Mexico D.F.','05033','Mexico',crypt('guillermofernandez7',gen_salt('bf',10)),'guillermofernandez'),
  ('Piccolo und mehr','Georg Pipps','Geislweg 14','Salzburg','5020','Austria',crypt('georgpipps39',gen_salt('bf',10)),'georgpipps'),
  ('Princesa Isabel Vinhoss','Isabel de Castro','Estrada da saude n. 58','Lisboa','1756','Portugal',crypt('isabeldecastro48',gen_salt('bf',10)),'isabeldecastro'),
  ('Que Delicia','Bernardo Batista','Rua da Panificadora, 12','Rio de Janeiro','02389-673','Brazil',crypt('bernardobatista92',gen_salt('bf',10)),'bernardobatista'),
  ('Queen Cozinha','Lucia Carvalho','Alameda dos Canarios, 891','Sao Paulo','05487-020','Brazil',crypt('luciacarvalho36',gen_salt('bf',10)),'luciacarvalho'),
  ('QUICK-Stop','Horst Kloss','Taucherstrasse 10','Cunewalde','01307','Germany',crypt('horstkloss30',gen_salt('bf',10)),'horstkloss'),
  ('Rancho grande','Sergio Gutiarrez','Av. del Libertador 900','Buenos Aires','1010','Argentina',crypt('sergiogutiarrez22',gen_salt('bf',10)),'sergiogutiarrez'),
  ('Rattlesnake Canyon Grocery','Paula Wilson','2817 Milton Dr.','Albuquerque','87110','USA',crypt('paulawilson60',gen_salt('bf',10)),'paulawilson'),
  ('Reggiani Caseifici','Maurizio Moroni','Strada Provinciale 124','Reggio Emilia','42100','Italy',crypt('mauriziomoroni11',gen_salt('bf',10)),'mauriziomoroni'),
  ('Ricardo Adocicados','Janete Limeira','Av. Copacabana, 267','Rio de Janeiro','02389-890','Brazil',crypt('janetelimeira46',gen_salt('bf',10)),'janetelimeira'),
  ('Richter Supermarkt','Michael Holz','Grenzacherweg 237','Geneve','1203','Switzerland',crypt('michaelholz36',gen_salt('bf',10)),'michaelholz'),
  ('Romero y tomillo','Alejandra Camino','Gran Via, 1','Madrid','28001','Spain',crypt('alejandracamino86',gen_salt('bf',10)),'alejandracamino'),
  ('Santa Gourmet','Jonas Bergulfsen','Erling Skakkes gate 78','Stavern','4110','Norway',crypt('jonasbergulfsen6',gen_salt('bf',10)),'jonasbergulfsen'),
  ('Save-a-lot Markets','Jose Pavarotti','187 Suffolk Ln.','Boise','83720','USA',crypt('josepavarotti63',gen_salt('bf',10)),'josepavarotti'),
  ('Seven Seas Imports','Hari Kumar','90 Wadhurst Rd.','London','OX15 4NB','UK',crypt('harikumar70',gen_salt('bf',10)),'harikumar'),
  ('Simons bistro','Jytte Petersen','Vinbeltet 34','Kobenhavn','1734','Denmark',crypt('jyttepetersen19',gen_salt('bf',10)),'jyttepetersen'),
  ('Specialites du monde','Dominique Perrier','25, rue Lauriston','Paris','75016','France',crypt('dominiqueperrier91',gen_salt('bf',10)),'dominiqueperrier'),
  ('Split Rail Beer & Ale','Art Braunschweiger','P.O. Box 555','Lander','82520','USA',crypt('artbraunschweiger31',gen_salt('bf',10)),'artbraunschweiger'),
  ('Supremes delices','Pascale Cartrain','Boulevard Tirou, 255','Charleroi','B-6000','Belgium',crypt('pascalecartrain16',gen_salt('bf',10)),'pascalecartrain'),
  ('The Big Cheese','Liz Nixon','89 Jefferson Way Suite 2','Portland','97201','USA',crypt('liznixon90',gen_salt('bf',10)),'liznixon'),
  ('The Cracker Box','Liu Wong','55 Grizzly Peak Rd.','Butte','59801','USA',crypt('liuwong17',gen_salt('bf',10)),'liuwong'),
  ('Toms Spezialiteten','Karin Josephs','Luisenstr. 48','Manster','44087','Germany',crypt('karinjosephs12',gen_salt('bf',10)),'karinjosephs'),
  ('Tortuga Restaurante','Miguel Angel Paolino','Avda. Azteca 123','Mexico D.F.','05033','Mexico',crypt('miguelangelpaolino5',gen_salt('bf',10)),'miguelangelpaolino'),
  ('Tradicao Hipermercados','Anabela Domingues','Av. Ines de Castro, 414','Sao Paulo','05634-030','Brazil',crypt('anabeladomingues6',gen_salt('bf',10)),'anabeladomingues'),
  ('Trails Head Gourmet Provisioners','Helvetius Nagy','722 DaVinci Blvd.','Kirkland','98034','USA',crypt('helvetiusnagy17',gen_salt('bf',10)),'helvetiusnagy'),
  ('Vaffeljernet','Palle Ibsen','Smagsloget 45','Arhus','8200','Denmark',crypt('palleibsen17',gen_salt('bf',10)),'palleibsen'),
  ('Victuailles en stock','Mary Saveley','2, rue du Commerce','Lyon','69004','France',crypt('marysaveley35',gen_salt('bf',10)),'marysaveley'),
  ('Vins et alcools Chevalier','Paul Henriot','59 rue de l Abbaye','Reims','51100','France',crypt('paulhenriot66',gen_salt('bf',10)),'paulhenriot'),
  ('Die Wandernde Kuh','Rita Moller','Adenauerallee 900','Stuttgart','70563','Germany',crypt('ritamoller20',gen_salt('bf',10)),'ritamoller'),
  ('Wartian Herkku','Pirkko Koskitalo','Torikatu 38','Oulu','90110','Finland',crypt('pirkkokoskitalo36',gen_salt('bf',10)),'pirkkokoskitalo'),
  ('Wellington Importadora','Paula Parente','Rua do Mercado, 12','Resende','08737-363','Brazil',crypt('paulaparente67',gen_salt('bf',10)),'paulaparente'),
  ('White Clover Markets','Karl Jablonski','305 - 14th Ave. S. Suite 3B','Seattle','98128','USA',crypt('karljablonski43',gen_salt('bf',10)),'karljablonski'),
  ('Wilman Kala','Matti Karttunen','Keskuskatu 45','Helsinki','21240','Finland',crypt('mattikarttunen43',gen_salt('bf',10)),'mattikarttunen'),
  ('Wolski','Zbyszek','ul. Filtrowa 68','Walla','01-012','Poland',crypt('zbyszek40',gen_salt('bf',10)),'zbyszek');

