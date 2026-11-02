--
-- PostgreSQL database dump
--

\restrict wdcXcgAaKRNPbs0BBvdI6ZvAQov3yOIrQ9BsxN3vBQFuy44A7CaLOkOp3oyVrUU

-- Dumped from database version 18.6 (Debian 18.6-1.pgdg13+2)
-- Dumped by pg_dump version 18.6 (Debian 18.6-1.pgdg13+2)

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
-- Name: asset; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asset (
    id integer NOT NULL,
    type character varying NOT NULL,
    url text NOT NULL,
    dimensions_id integer,
    name character varying,
    mime_type character varying,
    size_bytes integer,
    uploaded_at timestamp with time zone
);


--
-- Name: asset_collection; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asset_collection (
    id integer NOT NULL,
    role character varying NOT NULL,
    collection_id integer NOT NULL,
    asset_id integer NOT NULL,
    "position" integer NOT NULL
);


--
-- Name: asset_collection_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.asset_collection ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.asset_collection_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: asset_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.asset ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.asset_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: asset_text; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asset_text (
    id integer NOT NULL,
    type character varying NOT NULL,
    asset_id integer NOT NULL,
    text_id integer NOT NULL
);


--
-- Name: asset_text_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.asset_text ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.asset_text_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: client; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    logo character varying
);


--
-- Name: client_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.client ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.client_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: collection; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.collection (
    id integer NOT NULL,
    type character varying NOT NULL,
    publication_id integer NOT NULL,
    "position" integer NOT NULL,
    name character varying NOT NULL
);


--
-- Name: collection_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.collection ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.collection_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: content; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content (
    id integer NOT NULL,
    publication_id integer
);


--
-- Name: content_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.content ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.content_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: context; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.context (
    id integer NOT NULL,
    name character varying NOT NULL
);


--
-- Name: context_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.context ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.context_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: dimensions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dimensions (
    id integer NOT NULL,
    width integer NOT NULL,
    height integer NOT NULL
);


--
-- Name: dimensions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.dimensions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.dimensions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: meta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meta (
    id integer NOT NULL,
    title character varying NOT NULL,
    slug character varying NOT NULL,
    date date NOT NULL,
    status character varying NOT NULL,
    client_id integer
);


--
-- Name: meta_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.meta ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.meta_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: publication; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.publication (
    id integer NOT NULL,
    type_id integer NOT NULL,
    meta_id integer NOT NULL
);


--
-- Name: publication_asset; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.publication_asset (
    id integer NOT NULL,
    publication_id integer NOT NULL,
    asset_id integer NOT NULL,
    role character varying NOT NULL
);


--
-- Name: publication_asset_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.publication_asset ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.publication_asset_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: publication_context; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.publication_context (
    id integer NOT NULL,
    "position" integer NOT NULL,
    visible boolean NOT NULL,
    featured boolean NOT NULL,
    publication_id integer NOT NULL,
    context_id integer NOT NULL
);


--
-- Name: publication_context_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.publication_context ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.publication_context_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: publication_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.publication ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.publication_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: publication_skill_group; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.publication_skill_group (
    id integer NOT NULL,
    publication_id integer NOT NULL,
    skill_group_id integer NOT NULL
);


--
-- Name: publication_skill_group_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.publication_skill_group ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.publication_skill_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: publication_tag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.publication_tag (
    id integer NOT NULL,
    publication_id integer NOT NULL,
    tag_id integer NOT NULL
);


--
-- Name: publication_tag_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.publication_tag ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.publication_tag_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: skill; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skill (
    id integer NOT NULL,
    name character varying NOT NULL,
    icon character varying
);


--
-- Name: skill_group; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skill_group (
    id integer CONSTRAINT skill_group_id_not_null1 NOT NULL,
    name character varying(100) NOT NULL,
    description text
);


--
-- Name: skill_group_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.skill_group ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.skill_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: skill_group_skill; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skill_group_skill (
    id integer CONSTRAINT skill_group_skill_id_not_null1 NOT NULL,
    skill_group_id integer NOT NULL,
    skill_id integer NOT NULL
);


--
-- Name: skill_group_skill_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.skill_group_skill ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.skill_group_skill_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: skill_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.skill ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.skill_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tag (
    id integer NOT NULL,
    name character varying NOT NULL
);


--
-- Name: tag_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.tag ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.tag_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: text; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.text (
    id integer NOT NULL,
    text text NOT NULL,
    format character varying NOT NULL,
    CONSTRAINT "CHK_text_format" CHECK (((format)::text = ANY ((ARRAY['PLAIN'::character varying, 'MD'::character varying])::text[])))
);


--
-- Name: text_content; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.text_content (
    id integer NOT NULL,
    type character varying NOT NULL,
    content_id integer NOT NULL,
    text_id integer
);


--
-- Name: text_content_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.text_content ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.text_content_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: text_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.text ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.text_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.type (
    id integer NOT NULL,
    name character varying NOT NULL
);


--
-- Name: type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.type ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: asset PK_1209d107fe21482beaea51b745e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset
    ADD CONSTRAINT "PK_1209d107fe21482beaea51b745e" PRIMARY KEY (id);


--
-- Name: text_content PK_2ea24a6a41875b92fc637400deb; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.text_content
    ADD CONSTRAINT "PK_2ea24a6a41875b92fc637400deb" PRIMARY KEY (id);


--
-- Name: type PK_40410d6bf0bedb43f9cadae6fef; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.type
    ADD CONSTRAINT "PK_40410d6bf0bedb43f9cadae6fef" PRIMARY KEY (id);


--
-- Name: publication_context PK_5e1e09d5d0b58da4b88f38a1405; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication_context
    ADD CONSTRAINT "PK_5e1e09d5d0b58da4b88f38a1405" PRIMARY KEY (id);


--
-- Name: asset_collection PK_638842a7f249bcba515421e67a4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_collection
    ADD CONSTRAINT "PK_638842a7f249bcba515421e67a4" PRIMARY KEY (id);


--
-- Name: content PK_6a2083913f3647b44f205204e36; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content
    ADD CONSTRAINT "PK_6a2083913f3647b44f205204e36" PRIMARY KEY (id);


--
-- Name: dimensions PK_79693265d800ad0830d1ddddb41; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dimensions
    ADD CONSTRAINT "PK_79693265d800ad0830d1ddddb41" PRIMARY KEY (id);


--
-- Name: publication PK_8aea8363d5213896a78d8365fab; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication
    ADD CONSTRAINT "PK_8aea8363d5213896a78d8365fab" PRIMARY KEY (id);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: tag PK_8e4052373c579afc1471f526760; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag
    ADD CONSTRAINT "PK_8e4052373c579afc1471f526760" PRIMARY KEY (id);


--
-- Name: asset_text PK_94d7841bdb7a205a7312b50843d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_text
    ADD CONSTRAINT "PK_94d7841bdb7a205a7312b50843d" PRIMARY KEY (id);


--
-- Name: client PK_96da49381769303a6515a8785c7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client
    ADD CONSTRAINT "PK_96da49381769303a6515a8785c7" PRIMARY KEY (id);


--
-- Name: skill PK_a0d33334424e64fb78dc3ce7196; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill
    ADD CONSTRAINT "PK_a0d33334424e64fb78dc3ce7196" PRIMARY KEY (id);


--
-- Name: collection PK_ad3f485bbc99d875491f44d7c85; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection
    ADD CONSTRAINT "PK_ad3f485bbc99d875491f44d7c85" PRIMARY KEY (id);


--
-- Name: meta PK_c4c17a6c2bd7651338b60fc590b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meta
    ADD CONSTRAINT "PK_c4c17a6c2bd7651338b60fc590b" PRIMARY KEY (id);


--
-- Name: context PK_d1ff50573dd9c6c1d0896805701; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.context
    ADD CONSTRAINT "PK_d1ff50573dd9c6c1d0896805701" PRIMARY KEY (id);


--
-- Name: publication_tag PK_d4d6153a05bbfc7dcf6a3c9cae2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication_tag
    ADD CONSTRAINT "PK_d4d6153a05bbfc7dcf6a3c9cae2" PRIMARY KEY (id);


--
-- Name: text PK_ef734161ea7c326fedf699309f9; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.text
    ADD CONSTRAINT "PK_ef734161ea7c326fedf699309f9" PRIMARY KEY (id);


--
-- Name: publication_asset PK_publication_asset; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication_asset
    ADD CONSTRAINT "PK_publication_asset" PRIMARY KEY (id);


--
-- Name: publication_skill_group PK_publication_skill_group_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication_skill_group
    ADD CONSTRAINT "PK_publication_skill_group_id" PRIMARY KEY (id);


--
-- Name: skill_group PK_skill_group_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_group
    ADD CONSTRAINT "PK_skill_group_id" PRIMARY KEY (id);


--
-- Name: skill_group_skill PK_skill_group_skill_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_group_skill
    ADD CONSTRAINT "PK_skill_group_skill_id" PRIMARY KEY (id);


--
-- Name: publication REL_da9953cb1bf68eaeb0a53f814d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication
    ADD CONSTRAINT "REL_da9953cb1bf68eaeb0a53f814d" UNIQUE (meta_id);


--
-- Name: skill UQ_0f49a593960360f6f85b692aca8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill
    ADD CONSTRAINT "UQ_0f49a593960360f6f85b692aca8" UNIQUE (name);


--
-- Name: context UQ_11fcb6533bd2600f67ec71121e4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.context
    ADD CONSTRAINT "UQ_11fcb6533bd2600f67ec71121e4" UNIQUE (name);


--
-- Name: asset UQ_35c6eae153a827100bc8d7731cb; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset
    ADD CONSTRAINT "UQ_35c6eae153a827100bc8d7731cb" UNIQUE (url);


--
-- Name: publication_tag UQ_37b02fdff19489086b49589b4eb; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication_tag
    ADD CONSTRAINT "UQ_37b02fdff19489086b49589b4eb" UNIQUE (publication_id, tag_id);


--
-- Name: client UQ_480f88a019346eae487a0cd7f0c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client
    ADD CONSTRAINT "UQ_480f88a019346eae487a0cd7f0c" UNIQUE (name);


--
-- Name: asset_text UQ_5e1259167e1ba7eeb66f80adf95; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_text
    ADD CONSTRAINT "UQ_5e1259167e1ba7eeb66f80adf95" UNIQUE (asset_id, text_id, type);


--
-- Name: tag UQ_6a9775008add570dc3e5a0bab7b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag
    ADD CONSTRAINT "UQ_6a9775008add570dc3e5a0bab7b" UNIQUE (name);


--
-- Name: meta UQ_6c9ac9de277b94de4f53e685a0c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meta
    ADD CONSTRAINT "UQ_6c9ac9de277b94de4f53e685a0c" UNIQUE (slug);


--
-- Name: publication_context UQ_7a68133931c0e168c37bf55db18; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication_context
    ADD CONSTRAINT "UQ_7a68133931c0e168c37bf55db18" UNIQUE (context_id, "position") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: publication_context UQ_7b9e864834f4076137fcee39ebc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication_context
    ADD CONSTRAINT "UQ_7b9e864834f4076137fcee39ebc" UNIQUE (publication_id, context_id);


--
-- Name: dimensions UQ_94ea97a8db7ef980cd2ee7ebdf4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dimensions
    ADD CONSTRAINT "UQ_94ea97a8db7ef980cd2ee7ebdf4" UNIQUE (width, height);


--
-- Name: asset_collection UQ_bac858e3396c1cadcab30cb2083; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_collection
    ADD CONSTRAINT "UQ_bac858e3396c1cadcab30cb2083" UNIQUE (collection_id, "position") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: asset_collection UQ_d908566f57022e9b7c1fa0323ae; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_collection
    ADD CONSTRAINT "UQ_d908566f57022e9b7c1fa0323ae" UNIQUE (collection_id, asset_id, role);


--
-- Name: type UQ_e23bfe7255ada131861292923fe; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.type
    ADD CONSTRAINT "UQ_e23bfe7255ada131861292923fe" UNIQUE (name);


--
-- Name: collection UQ_e332d8b2091e283a95d3e5bb6a5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection
    ADD CONSTRAINT "UQ_e332d8b2091e283a95d3e5bb6a5" UNIQUE (publication_id, "position") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: publication_asset UQ_publication_asset_publication_asset_role; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication_asset
    ADD CONSTRAINT "UQ_publication_asset_publication_asset_role" UNIQUE (publication_id, asset_id, role);


--
-- Name: publication_skill_group UQ_publication_skill_group_pair; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication_skill_group
    ADD CONSTRAINT "UQ_publication_skill_group_pair" UNIQUE (publication_id, skill_group_id);


--
-- Name: skill_group_skill UQ_skill_group_skill_pair; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_group_skill
    ADD CONSTRAINT "UQ_skill_group_skill_pair" UNIQUE (skill_group_id, skill_id);


--
-- Name: collection FK_07816008fed30de147310b18807; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection
    ADD CONSTRAINT "FK_07816008fed30de147310b18807" FOREIGN KEY (publication_id) REFERENCES public.publication(id);


--
-- Name: asset_collection FK_0e0a904532f7aca1886dcf06e08; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_collection
    ADD CONSTRAINT "FK_0e0a904532f7aca1886dcf06e08" FOREIGN KEY (asset_id) REFERENCES public.asset(id);


--
-- Name: publication_context FK_4847767bf2d01e38c04d81d43ac; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication_context
    ADD CONSTRAINT "FK_4847767bf2d01e38c04d81d43ac" FOREIGN KEY (publication_id) REFERENCES public.publication(id);


--
-- Name: publication_tag FK_49383435ffc3faab115c66d64e6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication_tag
    ADD CONSTRAINT "FK_49383435ffc3faab115c66d64e6" FOREIGN KEY (publication_id) REFERENCES public.publication(id);


--
-- Name: meta FK_4ff1c374215328c2b79022fb864; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meta
    ADD CONSTRAINT "FK_4ff1c374215328c2b79022fb864" FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: publication_tag FK_6a7126b8707550756e20c2a516f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication_tag
    ADD CONSTRAINT "FK_6a7126b8707550756e20c2a516f" FOREIGN KEY (tag_id) REFERENCES public.tag(id);


--
-- Name: asset FK_6c119e237f064c043e9f62d15d9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset
    ADD CONSTRAINT "FK_6c119e237f064c043e9f62d15d9" FOREIGN KEY (dimensions_id) REFERENCES public.dimensions(id);


--
-- Name: publication FK_7ed367624a5d5eaab7a090a7580; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication
    ADD CONSTRAINT "FK_7ed367624a5d5eaab7a090a7580" FOREIGN KEY (type_id) REFERENCES public.type(id);


--
-- Name: asset_collection FK_827a55892e1494a5cc75fc6adb5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_collection
    ADD CONSTRAINT "FK_827a55892e1494a5cc75fc6adb5" FOREIGN KEY (collection_id) REFERENCES public.collection(id);


--
-- Name: text_content FK_964ab18970971823be4607a1d60; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.text_content
    ADD CONSTRAINT "FK_964ab18970971823be4607a1d60" FOREIGN KEY (text_id) REFERENCES public.text(id);


--
-- Name: asset_text FK_c015bfe24d5fb5bc5265657005c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_text
    ADD CONSTRAINT "FK_c015bfe24d5fb5bc5265657005c" FOREIGN KEY (text_id) REFERENCES public.text(id);


--
-- Name: text_content FK_c6e3df56251421a1fc665792b6a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.text_content
    ADD CONSTRAINT "FK_c6e3df56251421a1fc665792b6a" FOREIGN KEY (content_id) REFERENCES public.content(id);


--
-- Name: asset_text FK_c8ce809dadf1402b52394dc6cc3; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_text
    ADD CONSTRAINT "FK_c8ce809dadf1402b52394dc6cc3" FOREIGN KEY (asset_id) REFERENCES public.asset(id);


--
-- Name: publication_context FK_d4e8f9bcbba5ad7777524cde9f0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication_context
    ADD CONSTRAINT "FK_d4e8f9bcbba5ad7777524cde9f0" FOREIGN KEY (context_id) REFERENCES public.context(id);


--
-- Name: publication FK_da9953cb1bf68eaeb0a53f814d3; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication
    ADD CONSTRAINT "FK_da9953cb1bf68eaeb0a53f814d3" FOREIGN KEY (meta_id) REFERENCES public.meta(id);


--
-- Name: content FK_ed3038e0209d738f27118d9661c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content
    ADD CONSTRAINT "FK_ed3038e0209d738f27118d9661c" FOREIGN KEY (publication_id) REFERENCES public.publication(id);


--
-- Name: publication_asset FK_publication_asset_asset; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication_asset
    ADD CONSTRAINT "FK_publication_asset_asset" FOREIGN KEY (asset_id) REFERENCES public.asset(id);


--
-- Name: publication_asset FK_publication_asset_publication; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication_asset
    ADD CONSTRAINT "FK_publication_asset_publication" FOREIGN KEY (publication_id) REFERENCES public.publication(id);


--
-- Name: publication_skill_group FK_publication_skill_group_publication; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication_skill_group
    ADD CONSTRAINT "FK_publication_skill_group_publication" FOREIGN KEY (publication_id) REFERENCES public.publication(id);


--
-- Name: publication_skill_group FK_publication_skill_group_skill_group; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication_skill_group
    ADD CONSTRAINT "FK_publication_skill_group_skill_group" FOREIGN KEY (skill_group_id) REFERENCES public.skill_group(id);


--
-- Name: skill_group_skill FK_skill_group_skill_group; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_group_skill
    ADD CONSTRAINT "FK_skill_group_skill_group" FOREIGN KEY (skill_group_id) REFERENCES public.skill_group(id) ON DELETE CASCADE;


--
-- Name: skill_group_skill FK_skill_group_skill_skill; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_group_skill
    ADD CONSTRAINT "FK_skill_group_skill_skill" FOREIGN KEY (skill_id) REFERENCES public.skill(id);


--
-- PostgreSQL database dump complete
--

\unrestrict wdcXcgAaKRNPbs0BBvdI6ZvAQov3yOIrQ9BsxN3vBQFuy44A7CaLOkOp3oyVrUU

