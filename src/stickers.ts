// ============================================================
// DATOS OFICIALES - Álbum Panini FIFA World Cup 2026
// 980 figuritas: 20 portada/historia + 48 equipos × 20
// ============================================================

export interface Team {
  code: string
  name: string
  flag: string
  group: string
  players: string[] // 19 nombres (idx 0 = escudo FOIL, idx 11 = foto equipo)
}

export interface IntroSticker {
  id: string
  name: string
  foil: boolean
}

// ── SECCIÓN INTRODUCCIÓN (FWC) ── 20 cromos
export const INTRO_STICKERS: IntroSticker[] = [
  { id: 'P00',   name: 'Panini Logo',           foil: true },
  { id: 'FWC1',  name: 'Emblema Oficial',        foil: true },
  { id: 'FWC2',  name: 'Emblema Oficial 2',      foil: true },
  { id: 'FWC3',  name: 'Mascotas Oficiales',     foil: true },
  { id: 'FWC4',  name: 'Slogan Oficial',         foil: true },
  { id: 'FWC5',  name: 'Balón Oficial',          foil: true },
  { id: 'FWC6',  name: 'Canadá – Sede',          foil: true },
  { id: 'FWC7',  name: 'México – Sede',          foil: true },
  { id: 'FWC8',  name: 'USA – Sede',             foil: true },
  { id: 'FWC9',  name: 'Italia 1934',            foil: true },
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

// ── 48 SELECCIONES × 20 cromos cada una ──
// Cada equipo: [escudo_foil, jug1..jug10, foto_equipo, jug11..jug18]
// → índice 0 = escudo FOIL | índice 11 = foto equipo | resto = jugadores
export const TEAMS: Team[] = [
  // ── GRUPO A ──
  {
    code: 'MEX', name: 'México', flag: '🇲🇽', group: 'A',
    players: ['Escudo México','Luis Malagón','Johan Vásquez','Jorge Sánchez','Cesar Montes','Jesús Gallardo','Israel Reyes','Diego Lainez','Carlos Rodríguez','Edson Álvarez','Orbelin Pineda','Foto Equipo','Érick Sánchez','Hirving Lozano','Santiago Giménez','Raúl Jiménez','Alexis Vega','Roberto Alvarado','Cesar Huerta','Marcel Ruiz'],
  },
  {
    code: 'RSA', name: 'Sudáfrica', flag: '🇿🇦', group: 'A',
    players: ['Escudo Sudáfrica','Ronwen Williams','Sipho Chaine','Aubrey Modiba','Fawaaz Basadien','Siyanda Xulu','Mothobi Mvala','Teboho Mokoena','Themba Zwane','Nkosinathi Sibisi','Lyle Foster','Foto Equipo','Bongani Zungu','Percy Tau','Relebohile Mofokeng','Evidence Makgopa','Thapelo Morena','Elias Mokwana','Lebo Mothiba','Samukele Kamsoso'],
  },
  {
    code: 'SLV', name: 'El Salvador', flag: '🇸🇻', group: 'A',
    players: ['Escudo El Salvador','Mario González','Roberto Domínguez','Roberto Orellana','Alexander Larin','Carlos Portillo','Enrico Dueñas','Joshua Pérez','Jonathan Jiménez','Bryan Landaverde','Eriq Zavaleta','Foto Equipo','Nelson Bonilla','Darwin Cerén','Jairo Henríquez','Marvin Monterroza','Narciso Orellana','Alexis Ruano','Hugo Carrillo','Walmer Martínez'],
  },
  {
    code: 'NZL', name: 'Nueva Zelanda', flag: '🇳🇿', group: 'A',
    players: ['Escudo Nueva Zelanda','Max Crocombe','Liberato Cacace','Niko Kirwan','Michael Boxall','Bill Tuiloma','Winston Reid','Joe Bell','Clayton Lewis','Marko Šarić','Elijah Just','Foto Equipo','Matthew Garbett','Louis Fenton','Callum McCowatt','Myer Bevan','Dane Ingham','Chris Wood','Ben Waine','Oli Sail'],
  },
  // ── GRUPO B ──
  {
    code: 'USA', name: 'Estados Unidos', flag: '🇺🇸', group: 'B',
    players: ['Escudo USA','Matt Freese','Chris Richards','Tim Ream','Mark McKenzie','Alex Freeman','Antonee Robinson','Tyler Adams','Tanner Tessmann','Weston McKennie','Christian Roldan','Foto Equipo','Timothy Weah','Diego Luna','Malik Tillman','Christian Pulisic','Brenden Aaronson','Ricardo Pepi','Haji Wright','Folarin Balogun'],
  },
  {
    code: 'UZB', name: 'Uzbekistán', flag: '🇺🇿', group: 'B',
    players: ['Escudo Uzbekistán','Utkir Yusupov','Farrukh Sayfiev','Sherzod Nasrullaev','Umar Eshmurodov','Husniddin Aliqulov','Rustamjon Ashurmatov','Khojiakbar Alijonov','Abdukodir Khusanov','Odiljon Hamrobekov','Otabek Shukurov','Foto Equipo','Jamshid Iskanderov','Islom Tukhtashev','Eldor Shomurodov','Dostonbek Khamdamov','Ikromjon Alibaev','Jaloliddin Masharipov','Bobur Abdullayev','Jasur Yaxshiboyev'],
  },
  {
    code: 'PAN', name: 'Panamá', flag: '🇵🇦', group: 'B',
    players: ['Escudo Panamá','Orlando Mosquera','Abdiel Ayarza','Eric Davis','Harold Cummings','César Yanis','Roderick Miller','Adalberto Carrasquilla','Édgar Bárcenas','Aníbal Godoy','Cristian Martínez','Foto Equipo','Luis Ovalle','Cecilio Waterman','José Fajardo','Rolando Blackburn','Freddy Góndola','Alberto Quintero','Gabriel Torres','Ismael Díaz'],
  },
  {
    code: 'CIV', name: 'Costa de Marfil', flag: '🇨🇮', group: 'B',
    players: ['Escudo Costa de Marfil','Yahia Fofana','Wilfried Singo','Odilon Kossounou','Simon Deli','Ghislain Konan','Jean Michaël Seri','Franck Kessié','Ibrahim Sangaré','Sébastien Haller','Nicolas Pépé','Foto Equipo','Jonathan Kodjia','Maxwel Cornet','Amad Diallo','Jean-Philippe Krasso','Serge Aurier','Karim Konaté','Oumar Diakité','Ahmed Touré'],
  },
  // ── GRUPO C ──
  {
    code: 'ARG', name: 'Argentina', flag: '🇦🇷', group: 'C',
    players: ['Escudo Argentina','Emiliano Martínez','Nahuel Molina','Cristian Romero','Lisandro Martínez','Nicolás Tagliafico','Rodrigo De Paul','Leandro Paredes','Enzo Fernández','Alexis Mac Allister','Julián Álvarez','Foto Equipo','Lionel Messi ✦','Giovani Lo Celso','Nicolás González','Facundo Buonanotte','Valentín Carboni','Lautaro Martínez','Thiago Almada','Alejandro Garnacho'],
  },
  {
    code: 'SVN', name: 'Eslovenia', flag: '🇸🇮', group: 'C',
    players: ['Escudo Eslovenia','Jan Oblak','Jaka Bijol','Miha Blažič','Vanja Drkušić','Petar Stojanović','Adam Gnezda Čerin','Timi Max Elšnik','Sandi Lovrić','Žan Karničnik','Benjamin Šeško','Foto Equipo','Andraž Šporar','Erik Janža','Jasmin Kurtić','Jon Gorenc-Stanković','Arijan Ademi','Miha Mevlja','David Brekalo','Sven Šoštarič Karič'],
  },
  {
    code: 'CHI', name: 'Chile', flag: '🇨🇱', group: 'C',
    players: ['Escudo Chile','Brayan Cortés','Guillermo Maripán','Gary Medel','Igor Lichnovsky','Mauricio Isla','Victor Dávila','Charles Aránguiz','Sebastián Vegas','Ben Brereton Díaz','Pablo Milad','Foto Equipo','Marcos Bolados','Nicolás Castillo','Darío Osorio','Marcelino Núñez','Diego Valdés','Eduardo Vargas','Alexis Sánchez ✦','Eugenio Mena'],
  },
  {
    code: 'IRQ', name: 'Iraq', flag: '🇮🇶', group: 'C',
    players: ['Escudo Iraq','Jalal Hassan','Ali Adnan','Rebin Sulaka','Saad Natiq','Ali Faez','Hussein Ali','Safaa Hadi','Amjad Attwan','Aymen Hussein','Manaf Yousif','Foto Equipo','Mohanad Ali','Osama Rashid','Ahmed Yasin','Ali Jabbar','Bashar Resan','Alaa Abdul-Zahra','Muhammad Dawood','Ibrahim Bayesh'],
  },
  // ── GRUPO D ──
  {
    code: 'FRA', name: 'Francia', flag: '🇫🇷', group: 'D',
    players: ['Escudo Francia','Mike Maignan','Jonathan Clauss','Dayot Upamecano','Ibrahima Konaté','Theo Hernández','Aurélien Tchouaméni','Adrien Rabiot','Antoine Griezmann','Ousmane Dembélé','Marcus Thuram','Foto Equipo','Kylian Mbappé ✦','Eduardo Camavinga','William Saliba','Randal Kolo Muani','Christopher Nkunku','Jules Koundé','Mattéo Guendouzi','Bradley Barcola'],
  },
  {
    code: 'MAR', name: 'Marruecos', flag: '🇲🇦', group: 'D',
    players: ['Escudo Marruecos','Yassine Bounou','Noussair Mazraoui','Achraf Hakimi','Romain Saïss','Nayef Aguerd','Azzedine Ounahi','Sofyan Amrabat','Ilias Chair','Hakim Ziyech','Youssef En-Nesyri','Foto Equipo','Abde Ezzalzouli','Selim Amallah','Ayoub El Kaabi','Soufiane Rahimi','Bilal El Khannous','Ibrahim Salah','Amine Harit','Yahya Jabrane'],
  },
  {
    code: 'GTM', name: 'Guatemala', flag: '🇬🇹', group: 'D',
    players: ['Escudo Guatemala','Nicholas Hagen','Jonathan Ramos','Denil Maldonado','José León','Brandon Aguilera','José Pinto','Rodrigo Saravia','Rubio Rubín','Kevin Ramírez','Carlos Mejía','Foto Equipo','Oscar Santis','Elbin Bskilvis','Marco Pappa','Alejandro Aguilar','Paulo César Motta','Darwin Lom','José Manuel Contreras','Elías Vásquez'],
  },
  {
    code: 'AUS', name: 'Australia', flag: '🇦🇺', group: 'D',
    players: ['Escudo Australia','Mathew Ryan','Harry Souttar','Kye Rowles','Milos Degenek','Nathaniel Atkinson','Jackson Irvine','Riley McGree','Aziz Behich','Craig Goodwin','Mathew Leckie','Foto Equipo','Mitchell Duke','Martin Boyle','Garang Kuol','Cameron Burgess','Jordan Bos','Daniel Arzani','Joel King','Marco Tilio'],
  },
  // ── GRUPO E ──
  {
    code: 'ESP', name: 'España', flag: '🇪🇸', group: 'E',
    players: ['Escudo España','Unai Simón','Daniel Carvajal','Aymeric Laporte','Pau Cubarsí','Marc Cucurella','Rodri','Mikel Merino','Pedri','Fabián Ruiz','Lamine Yamal ✦','Foto Equipo','Álvaro Morata','Dani Olmo','Ferran Torres','Joselu','Alejandro Grimaldo','Gavi','David Raya','Nico Williams'],
  },
  {
    code: 'BIH', name: 'Bosnia-Herzegovina', flag: '🇧🇦', group: 'E',
    players: ['Escudo Bosnia','Ibrahim Šehić','Sadin Šušić','Ognjen Vranješ','Ermin Bičakčić','Toni Šunjić','Armin Hodžić','Alen Halilović','Haris Duljevic','Edin Džeko','Miralem Pjanić','Foto Equipo','Ermedin Demirović','Amer Gojak','Saša Bilbija','Rade Krunic','Muhamed Bešić','Tarik Ramović','Asmir Begovic','Senad Lulić'],
  },
  {
    code: 'THA', name: 'Tailandia', flag: '🇹🇭', group: 'E',
    players: ['Escudo Tailandia','Kawin Thamsatchanan','Tristan Do','Pansa Hemviboon','Elias Dolah','Thitipan Puangchan','Chanathip Songkrasin','Sarach Yooyen','Supachok Sarachat','Pokklaw Anan','Adisak Kraisorn','Foto Equipo','Teerasil Dangda','Jakkaphan Kaewprom','Nurul Sriyankem','Tanaboon Kesarat','Korrakot Wiriyaudomsiri','Suphanat Mueanta','Saritpong Sungro','Tristan Do II'],
  },
  {
    code: 'ECU', name: 'Ecuador', flag: '🇪🇨', group: 'E',
    players: ['Escudo Ecuador','Hernán Galíndez','Piero Hincapié','Robert Arboleda','Diego Palacios','Ángelo Preciado','Carlos Gruezo','José Cifuentes','Moisés Caicedo','Gonzalo Plata','Enner Valencia','Foto Equipo','Djorkaeff Reasco','Jhegson Méndez','Michael Estrada','Ángel Mena','Kevin Rodríguez','Jeremy Sarmiento','Pervis Estupiñán','Romario Ibarra'],
  },
  // ── GRUPO F ──
  {
    code: 'GER', name: 'Alemania', flag: '🇩🇪', group: 'F',
    players: ['Escudo Alemania','Manuel Neuer','Benjamin Pavard','Antonio Rüdiger','Jonathan Tah','Maximilian Mittelstädt','Toni Kroos','Joshua Kimmich','Jamal Musiala','Thomas Müller','Kai Havertz','Foto Equipo','Florian Wirtz ✦','Leon Goretzka','İlkay Gündoğan','Niclas Füllkrug','Leroy Sané','Serge Gnabry','Nico Schlotterbeck','Deniz Undav'],
  },
  {
    code: 'COL', name: 'Colombia', flag: '🇨🇴', group: 'F',
    players: ['Escudo Colombia','David Ospina','Santiago Arias','Dávinson Sánchez','Yerry Mina','Johan Mojica','Wilmar Barrios','Mateus Uribe','Juan Cuadrado','James Rodríguez','Radamel Falcao','Foto Equipo','Luis Díaz ✦','Jhon Córdoba','Rafael Santos Borré','Jorge Carrascal','Miguel Ángel Borja','Camilo Vargas','Eder Álvarez Balanta','Jefferson Lerma'],
  },
  {
    code: 'ALG', name: 'Argelia', flag: '🇩🇿', group: 'F',
    players: ['Escudo Argelia','Alexis Guendouz','Ramy Bensebaini','Youcef Atal','Rayan Aït-Nouri','Mohamed Amine Tougai','Aïssa Mandi','Said Benrahma','Hossam Aouar','Yacine Adli','Sofiane Feghouli','Foto Equipo','Islam Slimani','Ramiz Zerrouki','Baghdad Bounedjah','Farès Chaïbi','Nabil Bentaleb','Adlène Guedioura','Billal Brahimi','Ishak Belfodil'],
  },
  {
    code: 'JPN', name: 'Japón', flag: '🇯🇵', group: 'F',
    players: ['Escudo Japón','Shuichi Gonda','Yuto Nagatomo','Maya Yoshida','Ko Itakura','Hiroki Sakai','Hidemasa Morita','Wataru Endo','Kaoru Mitoma','Junya Ito','Takumi Minamino','Foto Equipo','Ayase Ueda','Ritsu Doan','Takefusa Kubo ✦','Yukinari Sugawara','Daichi Kamada','Hioki Machino','Kō Itakura','Seiya Maikuma'],
  },
  // ── GRUPO G ──
  {
    code: 'BRA', name: 'Brasil', flag: '🇧🇷', group: 'G',
    players: ['Escudo Brasil','Alisson Becker','Danilo','Marquinhos','Éder Militão','Alex Telles','Casemiro','Lucas Paquetá','Rodrygo','Raphinha','Vinícius Jr ✦','Foto Equipo','Neymar Jr ✦','Gabriel Martinelli','Endrick','Savinho','Gabriel Magalhães','Bremer','Matheus Cunha','Antony'],
  },
  {
    code: 'ISL', name: 'Islandia', flag: '🇮🇸', group: 'G',
    players: ['Escudo Islandia','Hannes Halldórsson','Ari Freyr Skúlason','Kári Árnason','Hólmar Eyjólfsson','Birkir Már Sævarsson','Gylfi Sigurdsson','Birkir Bjarnason','Johann Berg Gudmundsson','Jón Dadi Bödvarsson','Aron Gunnarsson','Foto Equipo','Arnór Ingvi Traustason','Alfreð Finnbogason','Rúnar Alex Rúnarsson','Mikael Andri Ingason','Sveinn Aron Gudjohnsen','Elías Már Ómarsson','Patrick Pedersen','Andri Lucas Gudjohnsen'],
  },
  {
    code: 'NGR', name: 'Nigeria', flag: '🇳🇬', group: 'G',
    players: ['Escudo Nigeria','Francis Uzoho','Ola Aina','William Troost-Ekong','Leon Balogun','Calvin Bassey','Frank Onyeka','Wilfred Ndidi','Alex Iwobi','Samuel Chukwueze','Victor Osimhen ✦','Foto Equipo','Kelechi Iheanacho','Moses Simon','Joe Aribo','Terem Moffi','Emmanuel Dennis','Ademola Lookman','Peter Olayinka','Taiwo Awoniyi'],
  },
  {
    code: 'KOR', name: 'Corea del Sur', flag: '🇰🇷', group: 'G',
    players: ['Escudo Corea del Sur','Kim Seung-gyu','Kim Jin-su','Kim Min-jae','Jung Seung-hyun','Lee Yong','Jung Woo-young','Lee Jae-sung','Son Heung-min ✦','Lee Kang-in','Hwang Hee-chan','Foto Equipo','Cho Gue-sung','Kim Young-gwon','Kwon Chang-hoon','Na Sang-ho','Oh Hyeon-gyu','Hwang In-beom','Jeong Woo-yeong','Song Min-kyu'],
  },
  // ── GRUPO H ──
  {
    code: 'POR', name: 'Portugal', flag: '🇵🇹', group: 'H',
    players: ['Escudo Portugal','Rui Patrício','João Cancelo','Pepe','Rúben Dias','Nuno Mendes','William Carvalho','Bernardo Silva','Bruno Fernandes','Rafael Leão','Cristiano Ronaldo ✦','Foto Equipo','João Félix','Diogo Jota','Vitinha','Francisco Conceição','Gonçalo Inácio','Gonçalo Ramos','Pedro Neto','Ricardo Horta'],
  },
  {
    code: 'TAN', name: 'Tanzania', flag: '🇹🇿', group: 'H',
    players: ['Escudo Tanzania','Metacha Mnata','Erasto Nyoni','Aggrey Morris','Kelvin John','Jonas Mkude','Thomas Ulimwengu','Himid Mao','Mudathiru Yahya','Patrick Silas','Simon Msuva','Foto Equipo','Mbwana Samatta','Idrissa Silla','Said Hamudu','Ibrahim Ajibu','Lusajo Mwakasege','George Lwandamina','John Bocco','Cletus Chama'],
  },
  {
    code: 'QAT', name: 'Qatar', flag: '🇶🇦', group: 'H',
    players: ['Escudo Qatar','Meshaal Barsham','Pedro Miguel','Bassam Al-Rawi','Abdelkarim Hassan','Boualem Khoukhi','Karimi Boudiaf','Assim Madibo','Hassan Al-Haydos','Ismaël Mohamad','Almoez Ali','Foto Equipo','Akram Afif ✦','Homam Ahmed','Abdulaziz Hatem','Ahmed Alaaeldin','Yusuf Abdurisag','Salem Al-Hajri','Khalid Muneer','Mohammed Waad'],
  },
  {
    code: 'BEL', name: 'Bélgica', flag: '🇧🇪', group: 'H',
    players: ['Escudo Bélgica','Thibaut Courtois','Timothy Castagne','Toby Alderweireld','Jan Vertonghen','Alexis Saelemaekers','Axel Witsel','Kevin De Bruyne ✦','Youri Tielemans','Jeremy Doku','Romelu Lukaku','Foto Equipo','Lois Openda','Eden Hazard','Leandro Trossard','Arthur Theate','Amadou Onana','Thomas Meunier','Johan Bakayoko','Zeno Debast'],
  },
  // ── GRUPO I ──
  {
    code: 'ENG', name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'I',
    players: ['Escudo Inglaterra','Jordan Pickford','Trent Alexander-Arnold','John Stones','Harry Maguire','Luke Shaw','Declan Rice','Jude Bellingham ✦','Phil Foden','Bukayo Saka','Marcus Rashford','Foto Equipo','Harry Kane','Jack Grealish','Mason Mount','James Maddison','Ollie Watkins','Conor Gallagher','Reece James','Cole Palmer'],
  },
  {
    code: 'TUN', name: 'Túnez', flag: '🇹🇳', group: 'I',
    players: ['Escudo Túnez','Aymen Dahmen','Mohamed Draeger','Dylan Bronn','Montassar Talbi','Ali Maaloul','Ellyes Skhiri','Hannibal Mejbri','Aïssa Laïdouni','Naïm Sliti','Wahbi Khazri','Foto Equipo','Youssef Msakni','Mohamed Ben Romdhane','Seifeddine Jaziri','Ghailene Chaalali','Ferjani Sassi','Issam Jebali','Taha Yassine Khenissi','Saif-Eddine Khaoui'],
  },
  {
    code: 'IRN', name: 'Irán', flag: '🇮🇷', group: 'I',
    players: ['Escudo Irán','Alireza Beiranvand','Shoja Khalilzadeh','Morteza Pouraliganji','Majid Hosseini','Ehsan Hajsafi','Said Ezatolahi','Alireza Jahanbakhsh','Mehdi Taremi','Sardar Azmoun','Karim Ansarifard','Foto Equipo','Ali Gholizadeh','Ramin Rezaeian','Saman Ghoddos','Vahid Amiri','Ahmad Noorollahi','Milad Mohammadi','Omid Ebrahimi','Kaveh Rezaei'],
  },
  {
    code: 'GRE', name: 'Grecia', flag: '🇬🇷', group: 'I',
    players: ['Escudo Grecia','Odysseas Vlachodimos','Kostas Tsimikas','Konstantinos Mavropanos','Panagiotis Retsos','Giorgos Kyriakopoulos','Kostas Fortounis','Anastasios Bakasetas','Stratos Svarnas','Giorgos Masouras','Giorgos Giakoumakis','Foto Equipo','Vangelis Pavlidis','Lazaros Rota','Sotiris Ninis','Christos Tzolis','Dimitris Siovas','Petros Mantalos','Tasos Chatzigiovanis','Marios Vrousai'],
  },
  // ── GRUPO J ──
  {
    code: 'NED', name: 'Países Bajos', flag: '🇳🇱', group: 'J',
    players: ['Escudo Países Bajos','Remko Pasveer','Denzel Dumfries','Matthijs de Ligt','Stefan de Vrij','Nathan Aké','Frenkie de Jong','Davy Klaassen','Teun Koopmeiners','Cody Gakpo','Memphis Depay','Foto Equipo','Virgil van Dijk ✦','Tijjani Reijnders','Donyell Malen','Wout Weghorst','Quinten Timber','Marten de Roon','Brian Brobbey','Steven Bergwijn'],
  },
  {
    code: 'POL', name: 'Polonia', flag: '🇵🇱', group: 'J',
    players: ['Escudo Polonia','Wojciech Szczęsny','Matty Cash','Kamil Glik','Jan Bednarek','Bartosz Bereszyński','Grzegorz Krychowiak','Krystian Bielik','Piotr Zieliński','Przemysław Frankowski','Arkadiusz Milik','Foto Equipo','Robert Lewandowski ✦','Jakub Moder','Nicola Zalewski','Karol Świderski','Damian Szymański','Kamil Piątkowski','Bartosz Slisz','Patryk Klimala'],
  },
  {
    code: 'IDN', name: 'Indonesia', flag: '🇮🇩', group: 'J',
    players: ['Escudo Indonesia','Ernando Ari Sutaryadi','Sandy Walsh','Jay Idzes','Elkan Baggott','Pratama Arhan','Marc Klok','Ivar Jenner','Thom Haye','Rafael Struick','Ragnar Oratmangoen','Foto Equipo','Shayne Pattynama','Egy Maulana Vikri','Marselino Ferdinan','Kevin Diks','Justin Hubner','Dean James','Jordi Amat','Nathan Tjoe-A-On'],
  },
  {
    code: 'UKR', name: 'Ucrania', flag: '🇺🇦', group: 'J',
    players: ['Escudo Ucrania','Andriy Lunin','Oleksandr Zinchenko','Mykola Matviyenko','Illia Zabarnyi','Vitaliy Mykolenko','Taras Stepanenko','Ruslan Malinovskiy','Mykhailo Mudryk ✦','Victor Tsygankov','Artem Dovbyk','Foto Equipo','Roman Yaremchuk','Oleksandr Pikhalyonok','Georgiy Sudakov','Heorhii Tsitaishvili','Serhiy Kryvtsov','Vladyslav Superliaha','Anatoliy Trubin','Serhiy Sydorchuk'],
  },
  // ── GRUPO K ──
  {
    code: 'CRO', name: 'Croacia', flag: '🇭🇷', group: 'K',
    players: ['Escudo Croacia','Dominik Livaković','Josip Stanišić','Dejan Lovren','Joško Gvardiol','Borna Ćorić','Mateo Kovačić','Luka Modrić ✦','Marcelo Brozović','Ivan Perišić','Andrej Kramarić','Foto Equipo','Bruno Petković','Nikola Vlašić','Mario Pašalić','Borna Sosa','Josip Sutalo','Luka Ivanušec','Dario Šimić','Petar Sučić'],
  },
  {
    code: 'SRB', name: 'Serbia', flag: '🇷🇸', group: 'K',
    players: ['Escudo Serbia','Predrag Rajković','Strahinja Pavlović','Nikola Milenković','Stefan Mitrović','Filip Mladenović','Nemanja Gudelj','Filip Kostić','Saša Lukić','Dušan Tadić','Aleksandar Mitrović','Foto Equipo','Sergej Milinković-Savić ✦','Andrija Živković','Luka Jović','Marko Lazetić','Darko Lazović','Nemanja Maksimović','Ivan Ilić','Nikola Milenković II'],
  },
  {
    code: 'CAN', name: 'Canadá', flag: '🇨🇦', group: 'K',
    players: ['Escudo Canadá','Maxime Crépeau','Alistair Johnston','Steven Vitória','Derek Cornelius','Richie Laryea','Samuel Piette','Stephen Eustáquio','Jonathan David','Tajon Buchanan','Cyle Larin','Foto Equipo','Alphonso Davies ✦','Liam Fraser','Junior Hoilett','Dénis Bouanga','Atiba Hutchinson','Marcus Godinho','David Wotherspoon','Charles-Andreas Brym'],
  },
  {
    code: 'PER', name: 'Perú', flag: '🇵🇪', group: 'K',
    players: ['Escudo Perú','Pedro Gallese','Luis Advíncula','Alexander Callens','Miguel Araujo','Miguel Trauco','Renato Tapia','Christian Cueva','Andy Polo','Gianluca Lapadula','André Carrillo','Foto Equipo','Edison Flores','Bryan Reyna','Santiago Ormeño','Raúl Ruidíaz','Raziel García','Sergio Peña','Aldo Corzo','Carlos Zambrano'],
  },
  // ── GRUPO L ──
  {
    code: 'ITA', name: 'Italia', flag: '🇮🇹', group: 'L',
    players: ['Escudo Italia','Gianluigi Donnarumma','Giovanni Di Lorenzo','Francesco Acerbi','Alessandro Bastoni','Federico Dimarco','Nicolò Barella','Jorginho','Giacomo Raspadori','Federico Chiesa','Ciro Immobile','Foto Equipo','Lorenzo Pellegrini','Marco Verratti','Davide Frattesi','Sandro Tonali','Mateo Retegui','Stephan El Shaarawy','Moise Kean','Alessandro Florenzi'],
  },
  {
    code: 'VEN', name: 'Venezuela', flag: '🇻🇪', group: 'L',
    players: ['Escudo Venezuela','Rafael Romo','Ronald Hernández','Yordan Osorio','Jhon Chancellor','Miguel Navarro','Jefferson Savarino','Yangel Herrera ✦','Tomás Rincón','Josef Martínez','Salomón Rondón','Foto Equipo','Eric Ramírez','Jhon Murillo','Jhonder Cádiz','Fernando Aristeguieta','Adalberto Peñaranda','Jan-Carlo Sim','Yorlis Machado','Christian Makoun'],
  },
  {
    code: 'SEN', name: 'Senegal', flag: '🇸🇳', group: 'L',
    players: ['Escudo Senegal','Édouard Mendy','Bouna Sarr','Kalidou Koulibaly','Abdou Diallo','Saliou Ciss','Cheikhou Kouyaté','Idrissa Gana Gueye','Nampalys Mendy','Ismaïla Sarr','Sadio Mané ✦','Foto Equipo','Bamba Dieng','Krepin Diatta','Iliman Ndiaye','Habib Diallo','Nicolas Jackson','Lamine Camara','Pape Matar Sarr','Formose Mendy'],
  },
  {
    code: 'MAL', name: 'Mali', flag: '🇲🇱', group: 'L',
    players: ['Escudo Mali','Djigui Diarra','Hamari Traoré','Molla Wagué','Boubacar Kouyaté','Yves Bissouma','Amadou Haidara','Moussa Djenepo','Adama Traoré','Ibrahim Koné','El Bilal Touré','Foto Equipo','Lassine Sinayoko','Kamory Doumbia','Mamadou Fofana','Seydou Kouyaté','Sambou Sissoko','Mohamed Camara','Cheick Doucouré','Boubacar Kouyaté II'],
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
  return INTRO_STICKERS.length + TEAMS.length * 20
}

export function getAllStickerKeys(): string[] {
  const keys: string[] = []
  INTRO_STICKERS.forEach(s => keys.push(s.id))
  TEAMS.forEach(t => {
    for (let i = 0; i < 20; i++) keys.push(getStickerKey(t.code, i))
  })
  return keys
}

export function isFoil(teamCode: string, idx: number): boolean {
  if (teamCode.startsWith('FWC') || teamCode === 'P00') return true
  return idx === 0
}
