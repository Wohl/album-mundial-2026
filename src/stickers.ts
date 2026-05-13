// ============================================================
// DATOS OFICIALES - Álbum Panini FIFA World Cup 2026
// Intro FWC: 9 | Equipos: 47 × 20 = 940 | Final FWC: 11 | Coca-Cola: 14
// Total: 974 stickers
// ============================================================

export interface Team {
  code: string
  name: string
  group: string
  players: string[] // 20 items: idx 0 = escudo FOIL, idx 11 = foto equipo
}

export interface IntroSticker {
  id: string
  name: string
  foil: boolean
}

export interface CCSticker {
  id: string
  name: string
  player: string
  foil: boolean
}

// ── INTRO FWC (P00 + FWC1–FWC8) — 9 stickers ───────────────
export const INTRO_FWC_STICKERS: IntroSticker[] = [
  { id: 'P00',  name: 'Cromo Panini Oficial',    foil: true },
  { id: 'FWC1', name: 'Emblema Oficial FWC',      foil: true },
  { id: 'FWC2', name: 'Emblema Oficial FWC 2',    foil: true },
  { id: 'FWC3', name: 'Mascotas Oficiales',        foil: true },
  { id: 'FWC4', name: 'Slogan Oficial',            foil: true },
  { id: 'FWC5', name: 'Balón Oficial',             foil: true },
  { id: 'FWC6', name: 'Host Country Emblem 1',     foil: true },
  { id: 'FWC7', name: 'Host Country Emblem 2',     foil: true },
  { id: 'FWC8', name: 'Host Country Emblem 3',     foil: true },
]

// ── FINAL FWC (FWC9–FWC19) — 11 stickers ───────────────────
export const FINAL_FWC_STICKERS: IntroSticker[] = [
  { id: 'FWC9',  name: 'Italia 1934',           foil: true },
  { id: 'FWC10', name: 'Uruguay 1950',           foil: true },
  { id: 'FWC11', name: 'Alemania Occ. 1954',     foil: true },
  { id: 'FWC12', name: 'Brasil 1962',            foil: true },
  { id: 'FWC13', name: 'Alemania Occ. 1974',     foil: true },
  { id: 'FWC14', name: 'Argentina 1986',         foil: true },
  { id: 'FWC15', name: 'Brasil 1994',            foil: true },
  { id: 'FWC16', name: 'Brasil 2002',            foil: true },
  { id: 'FWC17', name: 'Italia 2006',            foil: true },
  { id: 'FWC18', name: 'Alemania 2014',          foil: true },
  { id: 'FWC19', name: 'Argentina 2022',         foil: true },
]

// ── COCA-COLA SPECIAL EDITION (CC1–CC14) — 14 stickers ─────
export const COCA_COLA_STICKERS: CCSticker[] = [
  { id: 'CC1',  name: 'CC1 – Lamine Yamal',       player: 'Lamine Yamal',       foil: true },
  { id: 'CC2',  name: 'CC2 – Joshua Kimmich',      player: 'Joshua Kimmich',     foil: true },
  { id: 'CC3',  name: 'CC3 – Harry Kane',           player: 'Harry Kane',         foil: true },
  { id: 'CC4',  name: 'CC4 – Santiago Giménez',     player: 'Santiago Giménez',   foil: true },
  { id: 'CC5',  name: 'CC5 – Josko Gvardiol',       player: 'Josko Gvardiol',     foil: true },
  { id: 'CC6',  name: 'CC6 – Federico Valverde',    player: 'Federico Valverde',  foil: true },
  { id: 'CC7',  name: 'CC7 – Jefferson Lerma',      player: 'Jefferson Lerma',    foil: true },
  { id: 'CC8',  name: 'CC8 – Enner Valencia',       player: 'Enner Valencia',     foil: true },
  { id: 'CC9',  name: 'CC9 – Gabriel Magalhães',    player: 'Gabriel Magalhães',  foil: true },
  { id: 'CC10', name: 'CC10 – Virgil van Dijk',     player: 'Virgil van Dijk',    foil: true },
  { id: 'CC11', name: 'CC11 – Alphonso Davies',     player: 'Alphonso Davies',    foil: true },
  { id: 'CC12', name: 'CC12 – Emiliano Martínez',   player: 'Emiliano Martínez',  foil: true },
  { id: 'CC13', name: 'CC13 – Raúl Jiménez',        player: 'Raúl Jiménez',       foil: true },
  { id: 'CC14', name: 'CC14 – Lautaro Martínez',    player: 'Lautaro Martínez',   foil: true },
]

// ── 47 SELECCIONES × 20 cromos cada una ─────────────────────
// idx 0 = escudo FOIL | idx 11 = foto equipo | resto = jugadores
export const TEAMS: Team[] = [
  // ── GRUPO A ──
  {
    code: 'MEX', name: 'México', group: 'A',
    players: ['Escudo México','Luis Malagón','Johan Vásquez','Jorge Sánchez','Cesar Montes','Jesús Gallardo','Israel Reyes','Diego Lainez','Carlos Rodríguez','Edson Álvarez','Orbelin Pineda','Foto Equipo','Érick Sánchez','Hirving Lozano','Santiago Giménez','Raúl Jiménez','Alexis Vega','Roberto Alvarado','Cesar Huerta','Marcel Ruiz'],
  },
  {
    code: 'RSA', name: 'Sudáfrica', group: 'A',
    players: ['Escudo Sudáfrica','Ronwen Williams','Sipho Chaine','Aubrey Modiba','Fawaaz Basadien','Siyanda Xulu','Mothobi Mvala','Teboho Mokoena','Themba Zwane','Nkosinathi Sibisi','Lyle Foster','Foto Equipo','Bongani Zungu','Percy Tau','Relebohile Mofokeng','Evidence Makgopa','Thapelo Morena','Elias Mokwana','Lebo Mothiba','Samukele Kamsoso'],
  },
  {
    code: 'KOR', name: 'Rep. de Corea', group: 'A',
    players: ['Escudo Rep. de Corea','Kim Seung-gyu','Kim Jin-su','Kim Min-jae','Jung Seung-hyun','Lee Yong','Jung Woo-young','Lee Jae-sung','Son Heung-min ✦','Lee Kang-in','Hwang Hee-chan','Foto Equipo','Cho Gue-sung','Kim Young-gwon','Kwon Chang-hoon','Na Sang-ho','Oh Hyeon-gyu','Hwang In-beom','Jeong Woo-yeong','Song Min-kyu'],
  },
  {
    code: 'CZE', name: 'Czechia', group: 'A',
    players: ['Escudo Czechia','Jiří Staněk','Vladimír Coufal','Tomáš Holeš','David Jurásek','Adam Hložek','Tomáš Souček','Lukáš Provod','Ondřej Lingr','Patrik Schick','Jan Kuchta','Foto Equipo','Pavel Šulc','Antonín Barák','Marek Ondráček','Jan Bořil','Tomáš Čvančara','Mojmír Chytil','Alex Král','Martin Vitík'],
  },
  // ── GRUPO B ──
  {
    code: 'CAN', name: 'Canadá', group: 'B',
    players: ['Escudo Canadá','Maxime Crépeau','Alistair Johnston','Steven Vitória','Derek Cornelius','Richie Laryea','Samuel Piette','Stephen Eustáquio','Jonathan David','Tajon Buchanan','Cyle Larin','Foto Equipo','Alphonso Davies ✦','Liam Fraser','Junior Hoilett','Dénis Bouanga','Atiba Hutchinson','Marcus Godinho','David Wotherspoon','Charles-Andreas Brym'],
  },
  {
    code: 'BIH', name: 'Bosnia-Herzegovina', group: 'B',
    players: ['Escudo Bosnia','Ibrahim Šehić','Sadin Šušić','Ognjen Vranješ','Ermin Bičakčić','Toni Šunjić','Armin Hodžić','Alen Halilović','Haris Duljevic','Edin Džeko','Miralem Pjanić','Foto Equipo','Ermedin Demirović','Amer Gojak','Saša Bilbija','Rade Krunic','Muhamed Bešić','Tarik Ramović','Asmir Begovic','Senad Lulić'],
  },
  {
    code: 'QAT', name: 'Qatar', group: 'B',
    players: ['Escudo Qatar','Meshaal Barsham','Pedro Miguel','Bassam Al-Rawi','Abdelkarim Hassan','Boualem Khoukhi','Karimi Boudiaf','Assim Madibo','Hassan Al-Haydos','Ismaël Mohamad','Almoez Ali','Foto Equipo','Akram Afif ✦','Homam Ahmed','Abdulaziz Hatem','Ahmed Alaaeldin','Yusuf Abdurisag','Salem Al-Hajri','Khalid Muneer','Mohammed Waad'],
  },
  {
    code: 'SUI', name: 'Suiza', group: 'B',
    players: ['Escudo Suiza','Yann Sommer','Silvan Widmer','Fabian Schär','Manuel Akanji','Ricardo Rodríguez','Granit Xhaka','Remo Freuler','Xherdan Shaqiri','Ruben Vargas','Breel Embolo','Foto Equipo','Haris Seferović','Michel Aebischer','Denis Zakaria','Noah Okafor','Zeki Amdouni','Nico Elvedi','Dan Ndoye','Edimilson Fernandes'],
  },
  // ── GRUPO C ──
  {
    code: 'BRA', name: 'Brasil', group: 'C',
    players: ['Escudo Brasil','Alisson Becker','Danilo','Marquinhos','Éder Militão','Alex Telles','Casemiro','Lucas Paquetá','Rodrygo','Raphinha','Vinícius Jr ✦','Foto Equipo','Neymar Jr ✦','Gabriel Martinelli','Endrick','Savinho','Gabriel Magalhães','Bremer','Matheus Cunha','Antony'],
  },
  {
    code: 'MAR', name: 'Marruecos', group: 'C',
    players: ['Escudo Marruecos','Yassine Bounou','Noussair Mazraoui','Achraf Hakimi','Romain Saïss','Nayef Aguerd','Azzedine Ounahi','Sofyan Amrabat','Ilias Chair','Hakim Ziyech','Youssef En-Nesyri','Foto Equipo','Abde Ezzalzouli','Selim Amallah','Ayoub El Kaabi','Soufiane Rahimi','Bilal El Khannous','Ibrahim Salah','Amine Harit','Yahya Jabrane'],
  },
  {
    code: 'HAI', name: 'Haití', group: 'C',
    players: ['Escudo Haití','Josué Duverger','Shaquell Moore','Mechack Jérôme','Andrew Jean-Baptiste','Florent Ménard','Frantz Gilles','Duckens Nazon','Derrick Etienne','Djimy Alexis','Frantzdy Pierrot','Foto Equipo','Jeff Louis','Kevin Lafrance','Stéphane Alix','Wilde-Donald Guerrier','Louis Félix','Rony Jean','Jean-Marc Alexandre','Samson Hilaire'],
  },
  {
    code: 'SCO', name: 'Escocia', group: 'C',
    players: ['Escudo Escocia','Angus Gunn','Anthony Ralston','Grant Hanley','Jack Hendry','Andrew Robertson','Scott McTominay','Callum McGregor','John McGinn','Ryan Christie','Che Adams','Foto Equipo','Stuart Armstrong','Kenny McLean','Ryan Jack','Billy Gilmour','Lyndon Dykes','Lawrence Shankland','Ryan Gauld','Kevin Nisbet'],
  },
  // ── GRUPO D ──
  {
    code: 'USA', name: 'Estados Unidos', group: 'D',
    players: ['Escudo USA','Matt Freese','Chris Richards','Tim Ream','Mark McKenzie','Alex Freeman','Antonee Robinson','Tyler Adams','Tanner Tessmann','Weston McKennie','Christian Roldan','Foto Equipo','Timothy Weah','Diego Luna','Malik Tillman','Christian Pulisic','Brenden Aaronson','Ricardo Pepi','Haji Wright','Folarin Balogun'],
  },
  {
    code: 'PAR', name: 'Paraguay', group: 'D',
    players: ['Escudo Paraguay','Antony Silva','Omar Alderete','Junior Alonso','Gustavo Gómez','Héctor Martínez','Mathías Villasanti','Rodrigo Rojas','Miguel Almirón','Carlos González','Antonio Sanabria','Foto Equipo','Robert Morales','Alberto Espínola','Richard Sánchez','Cecilio Domínguez','Iván Ramírez','Alejandro Romero','Abel Hernández','Salvador Ferreira'],
  },
  {
    code: 'AUS', name: 'Australia', group: 'D',
    players: ['Escudo Australia','Mathew Ryan','Harry Souttar','Kye Rowles','Milos Degenek','Nathaniel Atkinson','Jackson Irvine','Riley McGree','Aziz Behich','Craig Goodwin','Mathew Leckie','Foto Equipo','Mitchell Duke','Martin Boyle','Garang Kuol','Cameron Burgess','Jordan Bos','Daniel Arzani','Joel King','Marco Tilio'],
  },
  // ── GRUPO E ──
  {
    code: 'GER', name: 'Alemania', group: 'E',
    players: ['Escudo Alemania','Manuel Neuer','Benjamin Pavard','Antonio Rüdiger','Jonathan Tah','Maximilian Mittelstädt','Toni Kroos','Joshua Kimmich','Jamal Musiala','Thomas Müller','Kai Havertz','Foto Equipo','Florian Wirtz ✦','Leon Goretzka','İlkay Gündoğan','Niclas Füllkrug','Leroy Sané','Serge Gnabry','Nico Schlotterbeck','Deniz Undav'],
  },
  {
    code: 'CUW', name: 'Curazao', group: 'E',
    players: ['Escudo Curazao','Eloy Room','Cuco Martina','Darryl Lachman','Rangelo Janga','Leandro Bacuna','Quentin Thurston','Gilson Tavares','Gevaro Nepomuceno','Gino van Kessel','Elson Hooi','Foto Equipo','Jurjën Goeloe','Karsten Laçen','Renzo Riquelme','Stijn Spierings','Lorenzo Lucassen','Jafar Arias','Nigel Thomas','Denzell Dumfries Jr'],
  },
  {
    code: 'CIV', name: 'Costa de Marfil', group: 'E',
    players: ['Escudo Costa de Marfil','Yahia Fofana','Wilfried Singo','Odilon Kossounou','Simon Deli','Ghislain Konan','Jean Michaël Seri','Franck Kessié','Ibrahim Sangaré','Sébastien Haller','Nicolas Pépé','Foto Equipo','Jonathan Kodjia','Maxwel Cornet','Amad Diallo','Jean-Philippe Krasso','Serge Aurier','Karim Konaté','Oumar Diakité','Ahmed Touré'],
  },
  {
    code: 'ECU', name: 'Ecuador', group: 'E',
    players: ['Escudo Ecuador','Hernán Galíndez','Piero Hincapié','Robert Arboleda','Diego Palacios','Ángelo Preciado','Carlos Gruezo','José Cifuentes','Moisés Caicedo','Gonzalo Plata','Enner Valencia','Foto Equipo','Djorkaeff Reasco','Jhegson Méndez','Michael Estrada','Ángel Mena','Kevin Rodríguez','Jeremy Sarmiento','Pervis Estupiñán','Romario Ibarra'],
  },
  // ── GRUPO F ──
  {
    code: 'NED', name: 'Países Bajos', group: 'F',
    players: ['Escudo Países Bajos','Remko Pasveer','Denzel Dumfries','Matthijs de Ligt','Stefan de Vrij','Nathan Aké','Frenkie de Jong','Davy Klaassen','Teun Koopmeiners','Cody Gakpo','Memphis Depay','Foto Equipo','Virgil van Dijk ✦','Tijjani Reijnders','Donyell Malen','Wout Weghorst','Quinten Timber','Marten de Roon','Brian Brobbey','Steven Bergwijn'],
  },
  {
    code: 'JPN', name: 'Japón', group: 'F',
    players: ['Escudo Japón','Shuichi Gonda','Yuto Nagatomo','Maya Yoshida','Ko Itakura','Hiroki Sakai','Hidemasa Morita','Wataru Endo','Kaoru Mitoma','Junya Ito','Takumi Minamino','Foto Equipo','Ayase Ueda','Ritsu Doan','Takefusa Kubo ✦','Yukinari Sugawara','Daichi Kamada','Hioki Machino','Seiya Maikuma','Jota'],
  },
  {
    code: 'SWE', name: 'Suecia', group: 'F',
    players: ['Escudo Suecia','Robin Olsen','Emil Krafth','Victor Lindelöf','Filip Helander','Ludwig Augustinsson','Jens Cajuste','Mattias Svanberg','Dejan Kulusevski','Emil Forsberg','Alexander Isak','Foto Equipo','Viktor Gyökeres ✦','Anthony Elanga','Jesper Karlsson','Jordan Larsson','Pontus Jansson','Marcus Danielson','Patrik Walemark','Benjamin Kamara'],
  },
  {
    code: 'TUN', name: 'Túnez', group: 'F',
    players: ['Escudo Túnez','Aymen Dahmen','Mohamed Draeger','Dylan Bronn','Montassar Talbi','Ali Maaloul','Ellyes Skhiri','Hannibal Mejbri','Aïssa Laïdouni','Naïm Sliti','Wahbi Khazri','Foto Equipo','Youssef Msakni','Mohamed Ben Romdhane','Seifeddine Jaziri','Ghailene Chaalali','Ferjani Sassi','Issam Jebali','Taha Yassine Khenissi','Saif-Eddine Khaoui'],
  },
  // ── GRUPO G ──
  {
    code: 'BEL', name: 'Bélgica', group: 'G',
    players: ['Escudo Bélgica','Thibaut Courtois','Timothy Castagne','Toby Alderweireld','Jan Vertonghen','Alexis Saelemaekers','Axel Witsel','Kevin De Bruyne ✦','Youri Tielemans','Jeremy Doku','Romelu Lukaku','Foto Equipo','Lois Openda','Eden Hazard','Leandro Trossard','Arthur Theate','Amadou Onana','Thomas Meunier','Johan Bakayoko','Zeno Debast'],
  },
  {
    code: 'EGY', name: 'Egipto', group: 'G',
    players: ['Escudo Egipto','Mohamed El-Shenawy','Ahmed Hegazy','Mohamed Abdelmonem','Ayman Ashraf','Omar Gaber','Tarek Hamed','Hamdi Fathi','Trézéguet','Marwan Hamdi','Mohamed Salah ✦','Foto Equipo','Omar Marmoush','Mostafa Mohamed','Amr El-Sulaya','Ahmed El-Sheikh','Ramadan Sobhi','Emam Ashour','Zizo','Mohamed El-Nenny'],
  },
  {
    code: 'IRN', name: 'Irán', group: 'G',
    players: ['Escudo Irán','Alireza Beiranvand','Shoja Khalilzadeh','Morteza Pouraliganji','Majid Hosseini','Ehsan Hajsafi','Said Ezatolahi','Alireza Jahanbakhsh','Mehdi Taremi','Sardar Azmoun','Karim Ansarifard','Foto Equipo','Ali Gholizadeh','Ramin Rezaeian','Saman Ghoddos','Vahid Amiri','Ahmad Noorollahi','Milad Mohammadi','Omid Ebrahimi','Kaveh Rezaei'],
  },
  {
    code: 'NZL', name: 'Nueva Zelanda', group: 'G',
    players: ['Escudo Nueva Zelanda','Max Crocombe','Liberato Cacace','Niko Kirwan','Michael Boxall','Bill Tuiloma','Winston Reid','Joe Bell','Clayton Lewis','Marko Šarić','Elijah Just','Foto Equipo','Matthew Garbett','Louis Fenton','Callum McCowatt','Myer Bevan','Dane Ingham','Chris Wood','Ben Waine','Oli Sail'],
  },
  // ── GRUPO H ──
  {
    code: 'ESP', name: 'España', group: 'H',
    players: ['Escudo España','Unai Simón','Daniel Carvajal','Aymeric Laporte','Pau Cubarsí','Marc Cucurella','Rodri','Mikel Merino','Pedri','Fabián Ruiz','Lamine Yamal ✦','Foto Equipo','Álvaro Morata','Dani Olmo','Ferran Torres','Joselu','Alejandro Grimaldo','Gavi','David Raya','Nico Williams'],
  },
  {
    code: 'CPV', name: 'Cabo Verde', group: 'H',
    players: ['Escudo Cabo Verde','Vozinha','Stopira','Steven Fortes','Jeffry Fortes','Patrick Andrade','Dylan Tavares','Jamiro Monteiro','Ryan Mendes','Garry Rodrigues','Julio Tavares','Foto Equipo','Deroy Duarte','Willy Semedo','Willie Fortes','Marco Soares','Bruno Varela','Emilio Cardozo','Sandro','Lisandro Semedo'],
  },
  {
    code: 'KSA', name: 'Arabia Saudí', group: 'H',
    players: ['Escudo Arabia Saudí','Mohammed Al-Owais','Saud Abdulhamid','Ali Al-Bulayhi','Abdulelah Al-Amri','Yasser Al-Shahrani','Salman Al-Faraj','Abdullah Otayf','Salem Al-Dawsari ✦','Mohammed Al-Burayk','Firas Al-Buraikan','Foto Equipo','Hattan Bahebri','Nasser Al-Dawsari','Turki Al-Ammar','Yasir Al-Shahrani','Sami Al-Najei','Mohammed Al-Qasem','Sultan Al-Ghannam','Riyadh Sharahili'],
  },
  {
    code: 'URU', name: 'Uruguay', group: 'H',
    players: ['Escudo Uruguay','Sergio Rochet','Nahitan Nández','Diego Godín','Ronald Araújo','Mathías Olivera','Federico Valverde ✦','Manuel Ugarte','Rodrigo Bentancur','Facundo Torres','Darwin Núñez','Foto Equipo','Luis Suárez','Edinson Cavani','Maxi Gómez','Nicolás De La Cruz','Brian Rodríguez','Sebastián Coates','Giorgian De Arrascaeta','Martín Cáceres'],
  },
  // ── GRUPO I ──
  {
    code: 'FRA', name: 'Francia', group: 'I',
    players: ['Escudo Francia','Mike Maignan','Jonathan Clauss','Dayot Upamecano','Ibrahima Konaté','Theo Hernández','Aurélien Tchouaméni','Adrien Rabiot','Antoine Griezmann','Ousmane Dembélé','Marcus Thuram','Foto Equipo','Kylian Mbappé ✦','Eduardo Camavinga','William Saliba','Randal Kolo Muani','Christopher Nkunku','Jules Koundé','Mattéo Guendouzi','Bradley Barcola'],
  },
  {
    code: 'SEN', name: 'Senegal', group: 'I',
    players: ['Escudo Senegal','Édouard Mendy','Bouna Sarr','Kalidou Koulibaly','Abdou Diallo','Saliou Ciss','Cheikhou Kouyaté','Idrissa Gana Gueye','Nampalys Mendy','Ismaïla Sarr','Sadio Mané ✦','Foto Equipo','Bamba Dieng','Krepin Diatta','Iliman Ndiaye','Habib Diallo','Nicolas Jackson','Lamine Camara','Pape Matar Sarr','Formose Mendy'],
  },
  {
    code: 'IRQ', name: 'Iraq', group: 'I',
    players: ['Escudo Iraq','Jalal Hassan','Ali Adnan','Rebin Sulaka','Saad Natiq','Ali Faez','Hussein Ali','Safaa Hadi','Amjad Attwan','Aymen Hussein','Manaf Yousif','Foto Equipo','Mohanad Ali','Osama Rashid','Ahmed Yasin','Ali Jabbar','Bashar Resan','Alaa Abdul-Zahra','Muhammad Dawood','Ibrahim Bayesh'],
  },
  {
    code: 'NOR', name: 'Noruega', group: 'I',
    players: ['Escudo Noruega','Ørjan Nyland','Kristoffer Ajer','Sander Berge','Stefan Strandberg','Birger Meling','Martin Ødegaard ✦','Mathias Normann','Fredrik Aursnes','Antonio Nusa','Erling Haaland ✦','Foto Equipo','Alexander Sørloth','Mohamed Elyounoussi','Julian Ryerson','Morten Thorsby','Ola Solbakken','Leo Östigård','Jens Petter Hauge','Kristian Thorstvedt'],
  },
  // ── GRUPO J ──
  {
    code: 'ARG', name: 'Argentina', group: 'J',
    players: ['Escudo Argentina','Emiliano Martínez','Nahuel Molina','Cristian Romero','Lisandro Martínez','Nicolás Tagliafico','Rodrigo De Paul','Leandro Paredes','Enzo Fernández','Alexis Mac Allister','Julián Álvarez','Foto Equipo','Lionel Messi ✦','Giovani Lo Celso','Nicolás González','Facundo Buonanotte','Valentín Carboni','Lautaro Martínez','Thiago Almada','Alejandro Garnacho'],
  },
  {
    code: 'ALG', name: 'Argelia', group: 'J',
    players: ['Escudo Argelia','Alexis Guendouz','Ramy Bensebaini','Youcef Atal','Rayan Aït-Nouri','Mohamed Amine Tougai','Aïssa Mandi','Said Benrahma','Hossam Aouar','Yacine Adli','Sofiane Feghouli','Foto Equipo','Islam Slimani','Ramiz Zerrouki','Baghdad Bounedjah','Farès Chaïbi','Nabil Bentaleb','Adlène Guedioura','Billal Brahimi','Ishak Belfodil'],
  },
  {
    code: 'AUT', name: 'Austria', group: 'J',
    players: ['Escudo Austria','Patrick Pentz','Stefan Posch','Philipp Lienhart','Maximilian Wöber','Philipp Mwene','Florian Grillitsch','Konrad Laimer','Marko Arnautović','Christoph Baumgartner','Marcel Sabitzer','Foto Equipo','David Alaba ✦','Michael Gregoritsch','Sasa Kalajdzic','Louis Schaub','Patrick Wimmer','Andreas Weimann','Xaver Schlager','Nicolas Seiwald'],
  },
  {
    code: 'JOR', name: 'Jordania', group: 'J',
    players: ['Escudo Jordania','Amer Shafi','Yazan Al-Naimat','Khaldon Bakar','Mohammad Al-Dmeiri','Ahmad Alattal','Baha Faisal','Mousa Al-Tamari','Hatem Aqel','Mohammad Abu Zema','Ahmad Shqeerat','Foto Equipo','Musa Al-Taamari','Saif Al-Rawabdeh','Hasan Abdel-Fattah','Khalil Bani Attiah','Ahmad Al-Sarour','Fares Hasan','Ibrahim Zarour','Omar Khrisat'],
  },
  // ── GRUPO K ──
  {
    code: 'POR', name: 'Portugal', group: 'K',
    players: ['Escudo Portugal','Rui Patrício','João Cancelo','Pepe','Rúben Dias','Nuno Mendes','William Carvalho','Bernardo Silva','Bruno Fernandes','Rafael Leão','Cristiano Ronaldo ✦','Foto Equipo','João Félix','Diogo Jota','Vitinha','Francisco Conceição','Gonçalo Inácio','Gonçalo Ramos','Pedro Neto','Ricardo Horta'],
  },
  {
    code: 'COD', name: 'Congo DR', group: 'K',
    players: ['Escudo Congo DR','Joël Kiassumbua','Chancel Mbemba','Arthur Masuaku','Marcel Tisserand','Pierre Kalulu','Aaron Tshibola','Marou Soumaré','Cédric Bakambu','Silas Wamangituka','Yannick Bolasie','Foto Equipo','Dodi Lukébakio','Neeskens Kebano','Théo Bongonda','Yoane Wissa','Fiston Mayele','Glody Ngonda','Christian Luyindama','Lionel Mpasi'],
  },
  {
    code: 'UZB', name: 'Uzbekistán', group: 'K',
    players: ['Escudo Uzbekistán','Utkir Yusupov','Farrukh Sayfiev','Sherzod Nasrullaev','Umar Eshmurodov','Husniddin Aliqulov','Rustamjon Ashurmatov','Khojiakbar Alijonov','Abdukodir Khusanov','Odiljon Hamrobekov','Otabek Shukurov','Foto Equipo','Jamshid Iskanderov','Islom Tukhtashev','Eldor Shomurodov','Dostonbek Khamdamov','Ikromjon Alibaev','Jaloliddin Masharipov','Bobur Abdullayev','Jasur Yaxshiboyev'],
  },
  {
    code: 'COL', name: 'Colombia', group: 'K',
    players: ['Escudo Colombia','David Ospina','Santiago Arias','Dávinson Sánchez','Yerry Mina','Johan Mojica','Wilmar Barrios','Mateus Uribe','Juan Cuadrado','James Rodríguez','Radamel Falcao','Foto Equipo','Luis Díaz ✦','Jhon Córdoba','Rafael Santos Borré','Jorge Carrascal','Miguel Ángel Borja','Camilo Vargas','Eder Álvarez Balanta','Jefferson Lerma'],
  },
  // ── GRUPO L ──
  {
    code: 'ENG', name: 'Inglaterra', group: 'L',
    players: ['Escudo Inglaterra','Jordan Pickford','Trent Alexander-Arnold','John Stones','Harry Maguire','Luke Shaw','Declan Rice','Jude Bellingham ✦','Phil Foden','Bukayo Saka','Marcus Rashford','Foto Equipo','Harry Kane','Jack Grealish','Mason Mount','James Maddison','Ollie Watkins','Conor Gallagher','Reece James','Cole Palmer'],
  },
  {
    code: 'CRO', name: 'Croacia', group: 'L',
    players: ['Escudo Croacia','Dominik Livaković','Josip Stanišić','Dejan Lovren','Joško Gvardiol','Borna Ćorić','Mateo Kovačić','Luka Modrić ✦','Marcelo Brozović','Ivan Perišić','Andrej Kramarić','Foto Equipo','Bruno Petković','Nikola Vlašić','Mario Pašalić','Borna Sosa','Josip Sutalo','Luka Ivanušec','Dario Šimić','Petar Sučić'],
  },
  {
    code: 'GHA', name: 'Ghana', group: 'L',
    players: ['Escudo Ghana','Lawrence Ati-Zigi','Daniel Amartey','Alexander Djiku','Jonathan Mensah','Gideon Mensah','Thomas Partey','Salis Abdul Samed','Mohammed Kudus','Jordan Ayew','André Ayew','Foto Equipo','Inaki Williams','Antoine Semenyo','Elisha Owusu','Ransford Königsdörffer','Tariq Lamptey','Abdul Fatawu Issahaku','Osman Bukari','Joseph Wollacott'],
  },
  {
    code: 'PAN', name: 'Panamá', group: 'L',
    players: ['Escudo Panamá','Orlando Mosquera','Abdiel Ayarza','Eric Davis','Harold Cummings','César Yanis','Roderick Miller','Adalberto Carrasquilla','Édgar Bárcenas','Aníbal Godoy','Cristian Martínez','Foto Equipo','Luis Ovalle','Cecilio Waterman','José Fajardo','Rolando Blackburn','Freddy Góndola','Alberto Quintero','Gabriel Torres','Ismael Díaz'],
  },
]

// ── HELPERS ──
export const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'] as const

export function getStickerKey(teamCode: string, idx: number): string {
  return `${teamCode}_${idx}`
}

export function getPlayerName(team: Team, idx: number): string {
  return team.players[idx] ?? `Jugador ${idx + 1}`
}

export function getTotalStickers(): number {
  return INTRO_FWC_STICKERS.length + FINAL_FWC_STICKERS.length + COCA_COLA_STICKERS.length + TEAMS.length * 20
}

export function getAllStickerKeys(): string[] {
  const keys: string[] = []
  INTRO_FWC_STICKERS.forEach(s => keys.push(s.id))
  TEAMS.forEach(t => {
    for (let i = 0; i < 20; i++) keys.push(getStickerKey(t.code, i))
  })
  FINAL_FWC_STICKERS.forEach(s => keys.push(s.id))
  COCA_COLA_STICKERS.forEach(s => keys.push(s.id))
  return keys
}
