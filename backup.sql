--
-- PostgreSQL database dump
--

\restrict qVkGNMAsGJS7MxbcMO6Edw9uTg17mqqmFBA9hfrIWYXhCRfYEvOSHZElb4Iyd3a

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: adresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.adresses (
    id integer NOT NULL,
    user_id integer,
    label text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.adresses OWNER TO postgres;

--
-- Name: adresses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.adresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.adresses_id_seq OWNER TO postgres;

--
-- Name: adresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.adresses_id_seq OWNED BY public.adresses.id;


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookings (
    id integer NOT NULL,
    user_id integer,
    service_id integer,
    date date NOT NULL,
    heure time without time zone,
    status character varying(20) DEFAULT 'en_attente'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    prestataire_id integer
);


ALTER TABLE public.bookings OWNER TO postgres;

--
-- Name: bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bookings_id_seq OWNER TO postgres;

--
-- Name: bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bookings_id_seq OWNED BY public.bookings.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer,
    message text NOT NULL,
    lu boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: prestataires; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prestataires (
    id integer NOT NULL,
    user_id integer,
    specialite character varying(100),
    disponible boolean DEFAULT true,
    note_moyenne numeric(3,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    latitude numeric(10,8),
    longitude numeric(11,8),
    telephone character varying(20),
    adresse text,
    tarif_horaire integer,
    specialites text[],
    disponibilites integer[],
    entreprise character varying(100),
    rc character varying(100),
    secteur character varying(100),
    annee_creation character varying(10),
    ville character varying(50),
    metier character varying(50)
);


ALTER TABLE public.prestataires OWNER TO postgres;

--
-- Name: prestataires_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.prestataires_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prestataires_id_seq OWNER TO postgres;

--
-- Name: prestataires_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.prestataires_id_seq OWNED BY public.prestataires.id;


--
-- Name: reclamations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reclamations (
    id integer NOT NULL,
    user_id integer,
    booking_id integer,
    description text NOT NULL,
    statut character varying(20) DEFAULT 'en_attente'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.reclamations OWNER TO postgres;

--
-- Name: reclamations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reclamations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reclamations_id_seq OWNER TO postgres;

--
-- Name: reclamations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reclamations_id_seq OWNED BY public.reclamations.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    user_id integer,
    service_id integer,
    note integer,
    commentaire text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT reviews_note_check CHECK (((note >= 1) AND (note <= 5)))
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reviews_id_seq OWNER TO postgres;

--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id integer NOT NULL,
    nom character varying(100) NOT NULL,
    description text,
    categorie character varying(50),
    prix numeric(10,2),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.services_id_seq OWNER TO postgres;

--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    nom character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'client'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: adresses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.adresses ALTER COLUMN id SET DEFAULT nextval('public.adresses_id_seq'::regclass);


--
-- Name: bookings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings ALTER COLUMN id SET DEFAULT nextval('public.bookings_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: prestataires id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestataires ALTER COLUMN id SET DEFAULT nextval('public.prestataires_id_seq'::regclass);


--
-- Name: reclamations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reclamations ALTER COLUMN id SET DEFAULT nextval('public.reclamations_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: services id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: adresses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.adresses (id, user_id, label, created_at) FROM stdin;
1	17	Rabat agdal	2026-04-20 14:37:10.783111
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bookings (id, user_id, service_id, date, heure, status, created_at, prestataire_id) FROM stdin;
4	9	9	2026-04-22	12:00:00	en_attente	2026-04-18 18:20:41.916418	\N
6	11	19	2026-04-20	09:00:00	refuse	2026-04-18 18:24:16.34765	\N
5	10	29	2026-04-20	09:00:00	refuse	2026-04-18 18:22:39.163498	\N
7	9	8	2026-04-19	09:00:00	en_attente	2026-04-19 22:54:31.037571	\N
9	9	9	2026-04-19	09:00:00	refuse	2026-04-19 23:27:19.010985	\N
11	9	10	2026-04-19	09:00:00	termine	2026-04-20 00:01:10.425888	\N
10	9	12	2026-04-20	09:00:00	termine	2026-04-19 23:31:33.245559	\N
8	9	12	2026-04-19	09:00:00	termine	2026-04-19 23:09:04.975685	\N
12	9	15	2026-04-20	09:00:00	en_attente	2026-04-20 11:11:22.808356	\N
13	17	8	2026-04-20	09:00:00	en_attente	2026-04-20 14:08:26.465339	\N
14	17	9	2026-04-20	09:00:00	en_attente	2026-04-20 14:08:42.166408	\N
15	17	8	2026-04-20	09:00:00	confirme	2026-04-20 14:56:55.173741	18
17	17	8	2026-04-20	15:09:00	termine	2026-04-20 15:09:59.889358	6
16	17	9	2026-04-20	09:00:00	refuse	2026-04-20 15:06:29.716211	\N
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, message, lu, created_at) FROM stdin;
1	9	Votre reservation pour "Electricite" le 2026-04-19 a ete envoyee !	t	2026-04-19 23:27:19.015666
2	9	Votre reservation pour "Climatisation" le 2026-04-20 a ete envoyee !	t	2026-04-19 23:31:33.251933
3	9	Votre réservation a été acceptée par le prestataire !	f	2026-04-19 23:56:22.430746
4	9	Votre réservation pour "Chauffagiste" le 2026-04-19 a été envoyée !	f	2026-04-20 00:01:10.433294
5	9	Votre réservation a été acceptée par le prestataire !	f	2026-04-20 00:17:56.350603
6	9	Votre réservation a été refusée.	f	2026-04-20 00:18:07.661201
7	9	Votre mission est terminée. Donnez votre avis !	f	2026-04-20 00:22:37.219104
8	9	Votre mission est terminée. Donnez votre avis !	f	2026-04-20 00:22:46.581265
9	9	Votre réservation a été acceptée par le prestataire !	f	2026-04-20 00:27:29.630187
10	9	Votre mission est terminée. Donnez votre avis !	f	2026-04-20 00:29:08.487691
11	9	Votre réservation pour "Nettoyage tapis" le 2026-04-20 a été envoyée !	f	2026-04-20 11:11:22.824768
12	17	Votre reservation pour "Plomberie" le 2026-04-20 a ete envoyee !	f	2026-04-20 14:08:26.498686
13	17	Votre reservation pour "Electricite" le 2026-04-20 a ete envoyee !	f	2026-04-20 14:08:42.175101
14	17	Votre reservation pour "Plomberie" le 2026-04-20 a ete envoyee !	f	2026-04-20 14:56:55.180868
15	17	Votre reservation a ete acceptee par le prestataire !	t	2026-04-20 14:57:42.491767
16	17	Votre reservation pour "Electricite" le 2026-04-20 a ete envoyee !	f	2026-04-20 15:06:29.720555
17	17	Votre reservation pour "Plomberie" le 2026-04-20 a ete envoyee !	f	2026-04-20 15:09:59.896701
18	17	Votre reservation a ete acceptee par le prestataire !	f	2026-04-20 15:19:57.425745
19	17	Votre mission est terminee. Donnez votre avis !	f	2026-04-20 15:20:11.983978
20	17	Votre reservation a ete refusee.	f	2026-04-20 15:23:28.526985
\.


--
-- Data for Name: prestataires; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prestataires (id, user_id, specialite, disponible, note_moyenne, created_at, latitude, longitude, telephone, adresse, tarif_horaire, specialites, disponibilites, entreprise, rc, secteur, annee_creation, ville, metier) FROM stdin;
5	18	\N	t	0.00	2026-04-20 14:50:24.953605	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2	13	nettoyage	t	0.00	2026-04-18 18:11:37.95067	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4	15	peinture	t	0.00	2026-04-18 18:12:46.535282	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1	6	reparation	t	0.00	2026-04-08 15:15:33.889815	\N	\N	0677889901	rabat	120	{Plomberie}	{0,1}	BenAli	Rabat	plomberie	2022		
\.


--
-- Data for Name: reclamations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reclamations (id, user_id, booking_id, description, statut, created_at) FROM stdin;
2	9	4	Installation mauvaise	resolu	2026-04-18 20:54:39.955592
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, user_id, service_id, note, commentaire, created_at) FROM stdin;
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (id, nom, description, categorie, prix, created_at) FROM stdin;
8	Plomberie	Reparation fuite, installation tuyaux	reparation	300.00	2026-04-18 17:52:49.803698
9	Electricite	Installation prise, reparation panne	reparation	400.00	2026-04-18 17:52:49.803698
10	Chauffagiste	Installation et reparation chauffage	reparation	450.00	2026-04-18 17:52:49.803698
11	Serrurier	Reparation serrure, installation verrou	reparation	250.00	2026-04-18 17:52:49.803698
12	Climatisation	Installation et entretien climatiseur	reparation	500.00	2026-04-18 17:52:49.803698
13	Nettoyage maison	Nettoyage complet domicile	nettoyage	200.00	2026-04-18 17:52:49.803698
14	Nettoyage vitres	Lavage vitres et fenetres	nettoyage	150.00	2026-04-18 17:52:49.803698
15	Nettoyage tapis	Nettoyage et desinfection tapis	nettoyage	180.00	2026-04-18 17:52:49.803698
16	Desinfection	Desinfection et sterilisation locaux	nettoyage	350.00	2026-04-18 17:52:49.803698
17	Jardinage	Taille arbres et entretien jardin	jardinage	150.00	2026-04-18 17:52:49.803698
18	Arrosage automatique	Installation systeme arrosage	jardinage	600.00	2026-04-18 17:52:49.803698
19	Baby sitting	Garde enfants a domicile	garde_enfants	80.00	2026-04-18 17:52:49.803698
20	Aide devoirs	Soutien scolaire a domicile	garde_enfants	100.00	2026-04-18 17:52:49.803698
21	Garde personnes agees	Assistance personnes agees	aide_personnes	120.00	2026-04-18 17:52:49.803698
22	Assistance medicale	Soins et assistance medicale a domicile	aide_personnes	200.00	2026-04-18 17:52:49.803698
23	Cuisinier domicile	Preparation repas a domicile	cuisine	300.00	2026-04-18 17:52:49.803698
24	Patissier domicile	Preparation patisseries sur commande	cuisine	250.00	2026-04-18 17:52:49.803698
25	Demenagement	Transport meubles et affaires	demenagement	800.00	2026-04-18 17:52:49.803698
26	Montage meubles	Montage et assemblage meubles	demenagement	200.00	2026-04-18 17:52:49.803698
27	Peinture interieure	Peinture murs et plafonds	peinture	400.00	2026-04-18 17:52:49.803698
28	Peinture exterieure	Ravalement facade et murs exterieurs	peinture	600.00	2026-04-18 17:52:49.803698
29	Decoration	Decoration interieure sur mesure	peinture	500.00	2026-04-18 17:52:49.803698
31	menage terasse		nettoyage	200.00	2026-04-19 21:39:50.067653
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, nom, email, password, role, created_at) FROM stdin;
2	Admin	admin@homeservices.com	$2b$10$flrWkCLtdummeEcOnQnnW.I6G1/AYWENbUV4G7RmSjh/2Gnalw/d.	admin	2026-03-23 18:58:58.416947
6	Ahmed Plombier	ahmed@gmail.com	$2b$10$d5IdsKjZEmz2NMxkeJ/b3eW1VAPDJ.aOSVLsFXa8l.wViHTyQ3ss.	prestataire	2026-04-08 15:15:33.880371
7	Karim Tazi	karim@gmail.com	$2b$10$EoHLC0icoilHzDiqvd74Ru3Ongmgwk6.VwitEmFDpr3PNPFHJ0u2O	client	2026-04-18 18:06:32.041347
9	Asmae TAKHCHI	asmae@gmail.com	$2b$10$Nqpp12XX9v9oCPTkLjNK1.t7SxPgIYlD9BV89ArVyUXZH3bvcYL0G	client	2026-04-18 18:07:38.940879
10	Meryem EL GHABRI	meryem@gmail.com	$2b$10$qIKN.gPpyeEFi6U81RpNFuqtLNL8VVGjRvDYofKpJ34pRmSSCtnIa	client	2026-04-18 18:08:02.173591
11	Souad EL MOUSSAIF	souad@gmail.com	$2b$10$SYZDO1or5qqRxkkh/tOTNekEiyDNoLaSjy8NfBDJC/h01MzE7H1ie	client	2026-04-18 18:08:36.731339
12	Doha AMDLAOU	doha@gmail.com	$2b$10$xQMDLK7DPLscGy5U5/WnxuQueTcF4/RrjMlobjssYrWHmvp0yvF6W	client	2026-04-18 18:10:07.125259
13	Amine cuisine	amine@gmail.com	$2b$10$.jBRmrhFfHV9Jj9cmm4FCec1S82TouoQCa2GdCYn77/qs.Np5WlVW	prestataire	2026-04-18 18:11:37.948668
15	Ghita decoration	ghita@gmail.com	$2b$10$TCt8bxYHWkYfZEtF41TqFO/IvTz.LncUI6KknHVgekbaffdFnvSJO	prestataire	2026-04-18 18:12:46.533786
17	ikram boubnane	ikramelgliti@gmail.com	$2b$10$UuvpoDzLck0Gf0bsbF4G/eGVX72UDBfxmuWooMwC0Z6NozA/SrKA2	client	2026-04-20 13:43:03.972942
18	Mohamed Plombier	mohamed@gmail.com	$2b$10$aMyks9Xwh7UWlad4NHDxN.eHVzUrSwwcc0Pxpfp0rRuzxGgXyk2Ha	prestataire	2026-04-20 14:50:24.950902
19	. 	takhchiasmae12@gmail.com	$2b$10$CP3L6/bwtv5krbajG.H9Me9bQtrHEkm/sHgShzHOcmmpQwwhZ603e	client	2026-04-20 23:03:44.925652
20	. 	takhchiasmae1@gmail.com	$2b$10$11AwYDcR0ivmvdzT8AUU0uVit0bFQsXNBwt161sIBe/PIDYKD7zyS	client	2026-04-20 23:04:09.584431
\.


--
-- Name: adresses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.adresses_id_seq', 1, true);


--
-- Name: bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bookings_id_seq', 17, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 20, true);


--
-- Name: prestataires_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.prestataires_id_seq', 5, true);


--
-- Name: reclamations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reclamations_id_seq', 3, true);


--
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reviews_id_seq', 1, true);


--
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.services_id_seq', 31, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 20, true);


--
-- Name: adresses adresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.adresses
    ADD CONSTRAINT adresses_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: prestataires prestataires_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestataires
    ADD CONSTRAINT prestataires_pkey PRIMARY KEY (id);


--
-- Name: reclamations reclamations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reclamations
    ADD CONSTRAINT reclamations_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: adresses adresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.adresses
    ADD CONSTRAINT adresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_prestataire_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_prestataire_id_fkey FOREIGN KEY (prestataire_id) REFERENCES public.users(id);


--
-- Name: bookings bookings_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: bookings bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: prestataires prestataires_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestataires
    ADD CONSTRAINT prestataires_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: reclamations reclamations_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reclamations
    ADD CONSTRAINT reclamations_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- Name: reclamations reclamations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reclamations
    ADD CONSTRAINT reclamations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: reviews reviews_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict qVkGNMAsGJS7MxbcMO6Edw9uTg17mqqmFBA9hfrIWYXhCRfYEvOSHZElb4Iyd3a

