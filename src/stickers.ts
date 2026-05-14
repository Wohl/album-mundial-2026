// ============================================================
// DATOS OFICIALES - Álbum Panini FIFA World Cup 2026
// Intro FWC: 9 | Equipos: 48 × 20 = 960 | Final FWC: 11 | Coca-Cola: 14
// Total: 994 stickers
// ============================================================

export interface Team {
  code: string
  name: string
  group: string
  players: string[] // 20 items: idx 0 = escudo FOIL, idx 12 = foto equipo
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

// ── 48 SELECCIONES × 20 cromos cada una ─────────────────────
// idx 0 = escudo FOIL | idx 12 = foto equipo | resto = jugadores
export const TEAMS: Team[] = [
  // ── GRUPO A ──
  {
    code: 'MEX', name: 'México', group: 'A',
    players: ['Escudo México','Luis Malagón','Johan Vásquez','Jorge Sánchez','Cesar Montes','Jesús Gallardo','Israel Reyes','Diego Lainez','Carlos Rodríguez','Edson Álvarez','Orbelin Pineda','Marcel Ruiz','Foto Equipo','Érick Sánchez','Hirving Lozano','Santiago Giménez','Raúl Jiménez','Alexis Vega','Roberto Alvarado','Cesar Huerta'],
  },
  {
    code: 'RSA', name: 'Sudáfrica', group: 'A',
    players: ['Escudo Sudáfrica','Ronwen Williams','Sipho Chaine','Aubrey Modiba','Samukele Kabini','Mbekezeli Mbokazi','Khulumani Ndamane','Siyabonga Ngezana','Khuliso Mudau','Nkosinathi Sibisi','Teboho Mokoena','Thalente Mbatha','Foto Equipo','Bathabile Aubaas','Yaya Sithole','Sipho Mbule','Lyle Foster','Iqraam Rayners','Mohau Nkota','Oswin Appollis'],
  },
  {
    code: 'KOR', name: 'Rep. de Corea', group: 'A',
    players: ['Escudo Rep. de Corea','Hyeon-woo Jo','Seung-gyu Kim','Min-jae Kim','Yu-min Cho','Young-woo Seol','Han-beom Lee','Tae-seok Lee','Myung-jae Lee','Jae-sung Lee','In-beom Hwang','Kang-in Lee','Foto Equipo','Seung-ho Paik','Jens Castrop','Dong-yeong Lee','Gue-sung Cho','Son Heung-min ✦','Hee-chan Hwang','Hyeon-gyu Oh'],
  },
  {
    code: 'CZE', name: 'Czechia', group: 'A',
    players: ['Escudo Czechia','Matěj Kovář','Jindřich Staněk','Ladislav Krejčí','Vladimír Coufal','Jaroslav Zelený','Tomáš Holeš','David Zima','Michal Sadílek','Lukáš Provod','Lukáš Červ','Tomáš Souček','Foto Equipo','Pavel Šulc','Matěj Vydra','Vasil Kušej','Tomáš Chorý','Václav Černý','Adam Hložek','Patrik Schick'],
  },
  // ── GRUPO B ──
  {
    code: 'CAN', name: 'Canadá', group: 'B',
    players: ['Escudo Canadá','Dayne St. Clair','Alphonso Davies ✦','Alistair Johnston','Samuel Adekugbe','Richie Laryea','Derek Cornelius','Moïse Bombito','Kamal Miller','Stephen Eustáquio','Ismaël Koné','Jonathan Osorio','Foto Equipo','Jacob Shaffelburg','Mathieu Choinière','Niko Sigur','Tajon Buchanan','Liam Millar','Cyle Larin','Jonathan David'],
  },
  {
    code: 'BIH', name: 'Bosnia-Herzegovina', group: 'B',
    players: ['Escudo Bosnia','Nikola Vasilj','Amer Dedić','Sead Kolašinac','Tarik Muharemović','Nihad Mujakić','Nikola Katić','Amir Hadžiahmetović','Benjamin Tahirović','Armin Gigović','Ivan Šunjić','Ivan Bašić','Foto Equipo','Dženis Burnić','Esmir Bajraktarević','Amar Memić','Ermedin Demirović','Edin Džeko','Samed Baždar','Haris Tabakovic'],
  },
  {
    code: 'QAT', name: 'Qatar', group: 'B',
    players: ['Escudo Qatar','Meshaal Barsham','Sultan Al-Brake','Lucas Mendes','Homam Ahmed','Boualem Khoukhi','Pedro Miguel','Tarek Salman','Mohamed Al-Mannai','Karim Boudiaf','Assim Madibo','Ahmed Fatehi','Foto Equipo','Mohammed Waad','Abdulaziz Hatem','Hassan Al-Haydos','Edmilson Júnior','Akram Hassan Afif ✦','Ahmed Al-Ghanei','Almoez Ali'],
  },
  {
    code: 'SUI', name: 'Suiza', group: 'B',
    players: ['Escudo Suiza','Gregor Kobel','Yvon Mvogo','Manuel Akanji','Ricardo Rodríguez','Nico Elvedi','Aurèle Amenda','Silvan Widmer','Granit Xhaka','Denis Zakaria','Remo Freuler','Fabian Rieder','Foto Equipo','Ardon Jashari','Johan Manzambi','Michel Aebischer','Breel Embolo','Ruben Vargas','Dan Ndoye','Zeki Amdouni'],
  },
  // ── GRUPO C ──
  {
    code: 'BRA', name: 'Brasil', group: 'C',
    players: ['Escudo Brasil','Alisson Becker','Bento','Marquinhos','Éder Militão','Gabriel Magalhães','Danilo','Wesley','Lucas Paquetá','Casemiro','Bruno Guimarães','Luiz Henrique','Foto Equipo','Vinícius Jr ✦','Rodrygo','João Pedro','Matheus Cunha','Gabriel Martinelli','Raphinha','Estévão'],
  },
  {
    code: 'MAR', name: 'Marruecos', group: 'C',
    players: ['Escudo Marruecos','Yassine Bounou','Munir El Kajoui','Achraf Hakimi','Noussair Mazraoui','Nayef Aguerd','Romain Saïss','Jawad El Yamiq','Adam Masina','Sofyan Amrabat','Azzedine Ounahi','Eliesse Ben Seghir','Foto Equipo','Bilal El Khannous','Ismaël Saibari','Youssef En-Nesyri','Abde Ezzalzouli','Soufiane Rahimi','Brahim Díaz','Ayoub El Kaabi'],
  },
  {
    code: 'HAI', name: 'Haití', group: 'C',
    players: ['Escudo Haití','Johny Placide','Carlens Arcus','Martin Expérience','Jean-Kevin Duverne','Ricardo Adé','Duke Lacroix','Garven Metusala','Hannes Delcroix','Leverton Pierre','Danley Jean Jacques','Jean-Ricner Bellegarde','Foto Equipo','Christopher Attys','Derrick Etienne Jr','Josue Casimir','Ruben Providence','Duckens Nazon','Louicius Deedson','Frantzdy Pierrot'],
  },
  {
    code: 'SCO', name: 'Escocia', group: 'C',
    players: ['Escudo Escocia','Angus Gunn','Jack Hendry','Kieran Tierney','Aaron Hickey','Andrew Robertson','Scott McKenna','John Souttar','Anthony Ralston','Grant Hanley','Scott McTominay','Billy Gilmour','Foto Equipo','Lewis Ferguson','Ryan Christie','Kenny McLean','John McGinn','Lyndon Dykes','Che Adams','Ben Doak'],
  },
  // ── GRUPO D ──
  {
    code: 'USA', name: 'Estados Unidos', group: 'D',
    players: ['Escudo USA','Matt Freese','Chris Richards','Tim Ream','Mark McKenzie','Alex Freeman','Antonee Robinson','Tyler Adams','Tanner Tessmann','Weston McKennie','Christian Roldan','Timothy Weah','Foto Equipo','Diego Luna','Malik Tillman','Christian Pulisic','Brenden Aaronson','Ricardo Pepi','Haji Wright','Folarin Balogun'],
  },
  {
    code: 'PAR', name: 'Paraguay', group: 'D',
    players: ['Escudo Paraguay','Roberto Fernández','Orlando Gill','Gustavo Gómez','Fabián Balbuena','Juan José Cáceres','Omar Alderete','Junior Alonso','Mathías Villasanti','Diego Gómez','Damián Bobadilla','Andrés Cubas','Foto Equipo','Matías Galarza','Julio Enciso','Alejandro Romero Gamarra','Miguel Almirón','Ramón Sosa','Ángel Romero','Antonio Sanabria'],
  },
  {
    code: 'AUS', name: 'Australia', group: 'D',
    players: ['Escudo Australia','Mathew Ryan','Joe Gauci','Harry Souttar','Alessandro Circati','Jordan Bos','Aziz Behich','Cameron Burgess','Lewis Miller','Milos Degenek','Jackson Irvine','Riley McGree','Foto Equipo','Aiden O\'Neill','Connor Metcalfe','Patrick Yazbek','Craig Goodwin','Kusini Yengi','Nestory Irankunda','Mohamed Touré'],
  },
  {
    code: 'TUR', name: 'Turquía', group: 'D',
    players: ['Escudo Turquía','Uğurcan Çakır','Mert Müldür','Zeki Çelik','Abdülkerim Bardakcı','Çağlar Söyüncü','Merih Demiral','Ferdi Kadıoğlu','Kaan Ayhan','İsmail Yüksek','Hakan Çalhanoğlu','Orkun Kökcü','Foto Equipo','Arda Güler ✦','İrfan Can Kahveci','Yunus Akgün','Can Uzun','Barış Alper Yılmaz','Kerem Aktürkoğlu','Kenan Yıldız'],
  },
  // ── GRUPO E ──
  {
    code: 'GER', name: 'Alemania', group: 'E',
    players: ['Escudo Alemania','Marc-André ter Stegen','Jonathan Tah','David Raum','Nico Schlotterbeck','Antonio Rüdiger','Waldemar Anton','Ridle Baku','Maximilian Mittelstädt','Joshua Kimmich','Florian Wirtz ✦','Felix Nmecha','Foto Equipo','Leon Goretzka','Jamal Musiala','Serge Gnabry','Kai Havertz','Leroy Sané','Karim Adeyemi','Nick Woltemade'],
  },
  {
    code: 'CUW', name: 'Curazao', group: 'E',
    players: ['Escudo Curazao','Eloy Room','Armando Obispo','Sherel Floranus','Jurién Gaari','Joshua Brenet','Roshon Van Eijma','Shurandy Sambo','Livano Comenencia','Godfried Roemeratoe','Juninho Bacuna','Leandro Bacuna','Foto Equipo','Tahith Chong','Kenji Gorre','Jearl Margaritha','Jurgen Locadia','Jeremy Antonisse','Gervane Kastaneer','Sontje Hansen'],
  },
  {
    code: 'CIV', name: 'Costa de Marfil', group: 'E',
    players: ['Escudo Costa de Marfil','Yahia Fofana','Ghislain Konan','Wilfried Singo','Odilon Kossounou','Evan N\'Dicka','Willy Boly','Emmanuel Agbadou','Ousmane Diomandé','Franck Kessié','Seko Fofana','Ibrahim Sangaré','Foto Equipo','Jean-Philippe Gbamin','Amad Diallo','Sébastien Haller','Simon Adingra','Yan Diomandé','Evann Guessand','Oumar Diakité'],
  },
  {
    code: 'ECU', name: 'Ecuador', group: 'E',
    players: ['Escudo Ecuador','Hernán Galíndez','Gonzalo Valle','Piero Hincapié','Pervis Estupiñán','Willian Pacho','Ángelo Preciado','Joel Ordóñez','Moisés Caicedo','Alan Franco','Kendry Páez','Pedro Vite','Foto Equipo','John Yeboah','Leonardo Campana','Gonzalo Plata','Nilson Angulo','Alan Minda','Kevin Rodríguez','Enner Valencia'],
  },
  // ── GRUPO F ──
  {
    code: 'NED', name: 'Países Bajos', group: 'F',
    players: ['Escudo Países Bajos','Bart Verbruggen','Virgil van Dijk ✦','Micky van de Ven','Jurriën Timber','Denzel Dumfries','Nathan Aké','Jeremie Frimpong','Jan Paul van Hecke','Tijjani Reijnders','Ryan Gravenberch','Teun Koopmeiners','Foto Equipo','Frenkie de Jong','Xavi Simons','Justin Kluivert','Memphis Depay','Donyell Malen','Wout Weghorst','Cody Gakpo'],
  },
  {
    code: 'JPN', name: 'Japón', group: 'F',
    players: ['Escudo Japón','Zion Suzuki','Hiroki Mochizuki','Ayumu Seko','Junnosuke Suzuki','Shogo Taniguchi','Tsuyoshi Watanabe','Kaishu Sano','Yuki Soma','Ao Tanaka','Daichi Kamada','Takefusa Kubo ✦','Foto Equipo','Ritsu Doan','Keito Nakamura','Takumi Minamino','Shuto Machino','Junya Ito','Koki Ogawa','Ayase Ueda'],
  },
  {
    code: 'SWE', name: 'Suecia', group: 'F',
    players: ['Escudo Suecia','Victor Johansson','Isak Hien','Gabriel Gudmundsson','Emil Holm','Victor Nilsson Lindelöf','Gustaf Lagerbielke','Lucas Bergvall','Hugo Larsson','Jesper Karlström','Yasin Ayari','Mattias Svanberg','Foto Equipo','Daniel Svensson','Ken Sema','Roony Bardghji','Dejan Kulusevski','Anthony Elanga','Alexander Isak','Viktor Gyökeres ✦'],
  },
  {
    code: 'TUN', name: 'Túnez', group: 'F',
    players: ['Escudo Túnez','Béchir Ben Said','Aymen Dahmen','Yan Valery','Montassar Talbi','Yassine Meriah','Ali Abdi','Dylan Bronn','Ellyes Skhiri','Aïssa Laïdouni','Ferjani Sassi','Mohamed Ali Ben Romdhane','Foto Equipo','Hannibal Mejbri','Elias Achouri','Elias Saad','Hazem Mastouri','Ismaël Gharbi','Sayfallah Ltaief','Naïm Sliti'],
  },
  // ── GRUPO G ──
  {
    code: 'BEL', name: 'Bélgica', group: 'G',
    players: ['Escudo Bélgica','Thibaut Courtois','Arthur Theate','Timothy Castagne','Zeno Debast','Brandon Mechele','Maxim De Cuyper','Thomas Meunier','Youri Tielemans','Amadou Onana','Nicolas Raskin','Alexis Saelemaekers','Foto Equipo','Hans Vanaken','Kevin De Bruyne ✦','Jérémy Doku','Charles De Ketelaere','Leandro Trossard','Loïs Openda','Romelu Lukaku'],
  },
  {
    code: 'EGY', name: 'Egipto', group: 'G',
    players: ['Escudo Egipto','Mohamed El-Shenawy','Mohamed Hany','Mohamed Hamdy','Yasser Ibrahim','Khaled Sobhi','Ramy Rabia','Hossam Abdelmaguid','Ahmed Fatouh','Marwan Attia','Zizo','Hamdy Fathi','Foto Equipo','Mohamed Lasheen','Emam Ashour','Osama Faisal','Mohamed Salah ✦','Mostafa Mohamed','Trézéguet','Omar Marmoush'],
  },
  {
    code: 'IRN', name: 'Irán', group: 'G',
    players: ['Escudo Irán','Alireza Beiranvand','Morteza Pouraliganji','Ehsan Hajsafi','Milad Mohammadi','Shoja Khalilzadeh','Ramin Rezaeian','Hossein Kanaani','Sadegh Moharrami','Saleh Hardani','Saeed Ezatolahi','Saman Ghoddos','Foto Equipo','Omid Noorafkan','Roozbeh Cheshmi','Mohammad Mohebi','Sardar Azmoun','Mehdi Taremi','Alireza Jahanbakhsh','Ali Gholizadeh'],
  },
  {
    code: 'NZL', name: 'Nueva Zelanda', group: 'G',
    players: ['Escudo Nueva Zelanda','Max Crocombe','Alex Paulsen','Michael Boxall','Liberato Cacace','Tim Payne','Tyler Bindon','Francis de Vries','Finn Surman','Joe Bell','Sarpreet Singh','Ryan Thomas','Foto Equipo','Matthew Garbett','Marko Stamenić','Ben Old','Chris Wood','Elijah Just','Callum McCowatt','Kosta Barbarouses'],
  },
  // ── GRUPO H ──
  {
    code: 'ESP', name: 'España', group: 'H',
    players: ['Escudo España','Unai Simón','Robin Le Normand','Aymeric Laporte','Dean Huijsen','Pedro Porro','Dani Carvajal','Marc Cucurella','Martín Zubimendi','Rodri','Pedri','Fabián Ruiz','Foto Equipo','Mikel Merino','Lamine Yamal ✦','Dani Olmo','Nico Williams','Ferran Torres','Álvaro Morata','Mikel Oyarzabal'],
  },
  {
    code: 'CPV', name: 'Cabo Verde', group: 'H',
    players: ['Escudo Cabo Verde','Vozinha','Logan Costa','Pico','Diney','Steven Moreira','Wagner Pina','João Paulo','Yannick Semedo','Kevin Pina','Patrick Andrade','Jamiro Monteiro','Foto Equipo','Deroy Duarte','Garry Rodrigues','Jovane Cabral','Ryan Mendes','Dailon Livramento','Willy Semedo','Bebé'],
  },
  {
    code: 'KSA', name: 'Arabia Saudí', group: 'H',
    players: ['Escudo Arabia Saudí','Nawaf Al-Aqidi','Abdulrahman Al-Sanbi','Saud Abdulhamid','Nawaf Bulayhi','Jihad Thakri','Moteb Al-Harbi','Hassan Al-Tambakti','Musab Al-Juwayr','Ziyad Al-Johani','Abdullah Al-Khaibari','Nasser Al-Dawsari','Foto Equipo','Saleh Abu Al-Shamat','Marwan Al-Sahafi','Salem Al-Dawsari ✦','Abdulrahman Al-Aboud','Feras Albrikan','Saleh Al-Shehri','Abdullah Al-Hamdan'],
  },
  {
    code: 'URU', name: 'Uruguay', group: 'H',
    players: ['Escudo Uruguay','Sergio Rochet','Santiago Mele','Ronald Araújo','José María Giménez','Sebastián Cáceres','Mathías Olivera','Guillermo Varela','Nahitan Nández','Federico Valverde ✦','Giorgian De Arrascaeta','Rodrigo Bentancur','Foto Equipo','Manuel Ugarte','Nicolás De La Cruz','Maxi Araújo','Darwin Núñez','Federico Viñas','Rodrigo Aguirre','Facundo Pellistri'],
  },
  // ── GRUPO I ──
  {
    code: 'FRA', name: 'Francia', group: 'I',
    players: ['Escudo Francia','Mike Maignan','Théo Hernández','William Saliba','Jules Koundé','Ibrahima Konaté','Dayot Upamecano','Lucas Digne','Aurélien Tchouaméni','Eduardo Camavinga','Manu Koné','Adrien Rabiot','Foto Equipo','Michael Olise','Ousmane Dembélé','Bradley Barcola','Désiré Doué','Kingsley Coman','Hugo Ekitike','Kylian Mbappé ✦'],
  },
  {
    code: 'SEN', name: 'Senegal', group: 'I',
    players: ['Escudo Senegal','Édouard Mendy','Yehvann Diouf','Moussa Niakhaté','Abdoulaye Seck','Ismail Jakobs','El Hadji Malick Diouf','Kalidou Koulibaly','Idrissa Gana Gueye','Pape Matar Sarr','Pape Gueye','Habib Diarra','Foto Equipo','Lamine Camara','Sadio Mané ✦','Ismaïla Sarr','Boulaye Dia','Iliman Ndiaye','Nicolas Jackson','Krepin Diatta'],
  },
  {
    code: 'IRQ', name: 'Iraq', group: 'I',
    players: ['Escudo Iraq','Jalal Hassan','Rebin Sulaka','Hussein Ali','Akam Hashem','Merchas Doski','Zaid Tahseen','Manaf Younis','Zidane Iqbal','Amir Al-Ammari','Ibrahim Bayesh','Ali Jasim','Foto Equipo','Youssef Amyn','Aimar Sher','Marko Farji','Osama Rashid','Ali Al-Hamadi','Aymen Hussein','Mohanad Ali'],
  },
  {
    code: 'NOR', name: 'Noruega', group: 'I',
    players: ['Escudo Noruega','Ørjan Nyland','Julian Ryerson','Leo Östigård','Kristoffer Ajer','Marcus Holmgren Pedersen','David Møller Wolfe','Torbjørn Heggem','Morten Thorsby','Martin Ødegaard ✦','Sander Berge','Andreas Schjelderup','Foto Equipo','Patrick Berg','Erling Haaland ✦','Alexander Sørloth','Aron Dønnum','Jørgen Strand Larsen','Antonio Nusa','Oscar Bobb'],
  },
  // ── GRUPO J ──
  {
    code: 'ARG', name: 'Argentina', group: 'J',
    players: ['Escudo Argentina','Emiliano Martínez','Nahuel Molina','Cristian Romero','Nicolás Otamendi','Nicolás Tagliafico','Leonardo Balerdi','Enzo Fernández','Alexis Mac Allister','Rodrigo De Paul','Exequiel Palacios','Leandro Paredes','Foto Equipo','Nico Paz','Franco Mastantuono','Nicolás González','Lionel Messi ✦','Lautaro Martínez','Julián Álvarez','Giuliano Simeone'],
  },
  {
    code: 'ALG', name: 'Argelia', group: 'J',
    players: ['Escudo Argelia','Alexis Guendouz','Ramy Bensebaini','Youcef Atal','Rayan Aït-Nouri','Mohamed Amine Tougai','Aïssa Mandi','Ismaël Bennacer','Hossem Aouar','Hicham Boudaoui','Ramiz Zerrouki','Nabil Bentaleb','Foto Equipo','Farès Chaïbi','Riyad Mahrez','Saïd Benrahma','Anis Hadj Moussa','Amine Gouiri','Baghdad Bounedjah','Mohammed Amoura'],
  },
  {
    code: 'AUT', name: 'Austria', group: 'J',
    players: ['Escudo Austria','Alexander Schlager','Patrick Pentz','David Alaba ✦','Kevin Danso','Philipp Lienhart','Stefan Posch','Philipp Mwene','Alexander Prass','Xaver Schlager','Marcel Sabitzer','Konrad Laimer','Foto Equipo','Florian Grillitsch','Nicolas Seiwald','Romano Schmid','Patrick Wimmer','Christoph Baumgartner','Michael Gregoritsch','Marko Arnautović'],
  },
  {
    code: 'JOR', name: 'Jordania', group: 'J',
    players: ['Escudo Jordania','Yazeed Abulaila','Ihsan Haddad','Mohammad Abu Hashish','Yazan Al-Arab','Abdallah Nasib','Saleem Obaid','Mohammad Abualnadi','Ibrahim Saadeh','Nizar Al-Rashdan','Noor Al-Rawabdeh','Mohannad Abu Taha','Foto Equipo','Amer Jamous','Musa Al-Taamari','Yazan Al-Naimat','Mahmoud Al-Mardi','Ali Olwan','Mohammad Abu Zrayq','Ibrahim Sabra'],
  },
  // ── GRUPO K ──
  {
    code: 'POR', name: 'Portugal', group: 'K',
    players: ['Escudo Portugal','Diogo Costa','José Sá','Rúben Dias','João Cancelo','Diogo Dalot','Nuno Mendes','Gonçalo Inácio','Bernardo Silva','Bruno Fernandes','Rúben Neves','Vitinha','Foto Equipo','João Neves','Cristiano Ronaldo ✦','Francisco Trincão','João Félix','Gonçalo Ramos','Pedro Neto','Rafael Leão'],
  },
  {
    code: 'COD', name: 'Congo DR', group: 'K',
    players: ['Escudo Congo DR','Lionel Mpasi','Aaron Wan-Bissaka','Axel Tuanzebe','Arthur Masuaku','Chancel Mbemba','Joris Kayembe','Charles Pickel','Ngal\'ayel Mukau','Edo Kayembe','Samuel Moutoussamy','Noah Sadiki','Foto Equipo','Théo Bongonda','Meschak Elia','Yoane Wissa','Brian Cipenga','Fiston Mayele','Cédric Bakambu','Nathanaël Mbuku'],
  },
  {
    code: 'UZB', name: 'Uzbekistán', group: 'K',
    players: ['Escudo Uzbekistán','Utkir Yusupov','Farrukh Sayfiev','Sherzod Nasrullaev','Umar Eshmurodov','Husniddin Aliqulov','Rustamjon Ashurmatov','Khojiakbar Alijonov','Abdukodir Khusanov','Odiljon Hamrobekov','Otabek Shukurov','Jamshid Iskanderov','Foto Equipo','Azizbek Turgunboev','Khojimat Erkinov','Eldor Shomurodov','Oston Urunov','Jaloliddin Masharipov','Igor Sergeev','Abbosbek Fayzullaev'],
  },
  {
    code: 'COL', name: 'Colombia', group: 'K',
    players: ['Escudo Colombia','Camilo Vargas','David Ospina','Dávinson Sánchez','Yerry Mina','Daniel Muñoz','Johan Mojica','Jhon Lucumí','Santiago Arias','Jefferson Lerma','Kevin Castaño','Richard Ríos','Foto Equipo','James Rodríguez','Juan Fernando Quintero','Jorge Carrascal','Jon Arias','Jhon Córdoba','Luis Suárez','Luis Díaz ✦'],
  },
  // ── GRUPO L ──
  {
    code: 'ENG', name: 'Inglaterra', group: 'L',
    players: ['Escudo Inglaterra','Jordan Pickford','John Stones','Marc Guéhi','Ezri Konsa','Trent Alexander-Arnold','Reece James','Dan Burn','Jordan Henderson','Declan Rice','Jude Bellingham ✦','Cole Palmer','Foto Equipo','Morgan Rogers','Anthony Gordon','Phil Foden','Bukayo Saka','Harry Kane','Marcus Rashford','Ollie Watkins'],
  },
  {
    code: 'CRO', name: 'Croacia', group: 'L',
    players: ['Escudo Croacia','Dominik Livaković','Duje Ćaleta-Car','Joško Gvardiol','Josip Stanišić','Luka Vušković','Josip Šutalo','Kristijan Jakić','Luka Modrić ✦','Mateo Kovačić','Martin Baturina','Lovro Majer','Foto Equipo','Mario Pašalić','Petar Sučić','Ivan Perišić','Marco Pašalić','Ante Budimir','Andrej Kramarić','Franjo Ivanović'],
  },
  {
    code: 'GHA', name: 'Ghana', group: 'L',
    players: ['Escudo Ghana','Lawrence Ati-Zigi','Tariq Lamptey','Mohammed Salisu','Alidu Seidu','Alexander Djiku','Gideon Mensah','Caleb Yirenkyi','Abdul Fatawu Issahaku','Thomas Partey','Salis Abdul Samed','Kamaldeen Sulemana','Foto Equipo','Mohammed Kudus','Iñaki Williams','Jordan Ayew','André Ayew','Joseph Paintsil','Osman Bukari','Antoine Semenyo'],
  },
  {
    code: 'PAN', name: 'Panamá', group: 'L',
    players: ['Escudo Panamá','Orlando Mosquera','Luis Mejía','Fidel Escobar','Andrés Andrade','Amir Murillo','Eric Davis','José Córdoba','César Blackman','Cristian Martínez','Aníbal Godoy','Adalberto Carrasquilla','Foto Equipo','Édgar Bárcenas','Carlos Harvey','Ismael Díaz','José Fajardo','Cecilio Waterman','José Luis Rodríguez','Alberto Quintero'],
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
