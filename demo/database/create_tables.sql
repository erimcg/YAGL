drop table if exists vertices_t;
drop table if exists edges_t;

create table if not exists vertices_t (
    vid integer primary key,
    data text
);

create table if not exists edges_t (
    eid integer primary key,
    vid1 integer not null,
    vid2 integer not null,
    data text,
    foreign key (vid1) references vertices_t (vid) on delete cascade,
    foreign key (vid2) references vertices_t (vid) on delete cascade
);

insert into vertices_t values
(1, 'https://youtu.be/ru0K8uYEZWw?list=PLvFYFNbi-IBEzlv32QUnKOdmokcDrP3Oq'),
(2, 'https://youtu.be/fRh_vgS2dFE?list=PLvFYFNbi-IBEzlv32QUnKOdmokcDrP3Oq'),
(3, 'https://youtu.be/LHCob76kigA?list=PLvFYFNbi-IBEzlv32QUnKOdmokcDrP3Oq'),
(4, 'https://youtu.be/5Nrv5teMc9Y?list=PLvFYFNbi-IBEzlv32QUnKOdmokcDrP3Oq'),
(5, 'https://youtu.be/7PCkvCPvDXk?list=PLvFYFNbi-IBEzlv32QUnKOdmokcDrP3Oq'),
(6, 'https://youtu.be/pXRviuL6vMY?list=PLvFYFNbi-IBEzlv32QUnKOdmokcDrP3Oq'),
(7, 'https://youtu.be/09R8_2nJtjg?list=PLvFYFNbi-IBEzlv32QUnKOdmokcDrP3Oq'),
(8, 'https://youtu.be/e-ORhEE9VVg?list=PLvFYFNbi-IBEzlv32QUnKOdmokcDrP3Oq');

