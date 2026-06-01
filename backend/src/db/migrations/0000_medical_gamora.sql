CREATE TABLE "areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"descripcion" text,
	"jefe_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "areas_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "auditoria_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario_id" integer NOT NULL,
	"accion" varchar(50) NOT NULL,
	"rol_id" integer NOT NULL,
	"realizado_por_usuario_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "capacitaciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"descripcion" text,
	"area_id" integer NOT NULL,
	"capacitador_id" integer NOT NULL,
	"fecha" date NOT NULL,
	"hora_inicio" time NOT NULL,
	"duracion_minutos" integer NOT NULL,
	"plataforma" varchar(100) NOT NULL,
	"max_participantes" integer NOT NULL,
	"google_calendar_event_id" varchar(255),
	"outlook_calendar_event_id" varchar(255),
	"estado" varchar(50) DEFAULT 'programada' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permisos" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(100) NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"descripcion" text,
	"modulo" varchar(50) NOT NULL,
	"accion" varchar(50) NOT NULL,
	"es_activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permisos_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "registros_capacitacion" (
	"id" serial PRIMARY KEY NOT NULL,
	"capacitacion_id" integer NOT NULL,
	"usuario_id" integer NOT NULL,
	"registrado_en" timestamp DEFAULT now() NOT NULL,
	"asistio" boolean DEFAULT false,
	"comentarios" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_capacitacion_usuario" UNIQUE("capacitacion_id","usuario_id")
);
--> statement-breakpoint
CREATE TABLE "role_permisos" (
	"id" serial PRIMARY KEY NOT NULL,
	"rol_id" integer NOT NULL,
	"permiso_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_rol_permiso" UNIQUE("rol_id","permiso_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(50) NOT NULL,
	"descripcion" text,
	"nivel_jerarquia" integer NOT NULL,
	"es_activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255),
	"nombre" varchar(100) NOT NULL,
	"apellido" varchar(100) NOT NULL,
	"area_id" integer NOT NULL,
	"google_id" varchar(255),
	"outlook_id" varchar(255),
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "usuarios_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario_id" integer NOT NULL,
	"rol_id" integer NOT NULL,
	"asignado_por_usuario_id" integer,
	"asignado_en" timestamp DEFAULT now() NOT NULL,
	"es_activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_usuario_rol" UNIQUE("usuario_id","rol_id")
);
--> statement-breakpoint
ALTER TABLE "areas" ADD CONSTRAINT "areas_jefe_id_usuarios_id_fk" FOREIGN KEY ("jefe_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditoria_roles" ADD CONSTRAINT "auditoria_roles_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditoria_roles" ADD CONSTRAINT "auditoria_roles_rol_id_roles_id_fk" FOREIGN KEY ("rol_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditoria_roles" ADD CONSTRAINT "auditoria_roles_realizado_por_usuario_id_usuarios_id_fk" FOREIGN KEY ("realizado_por_usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capacitaciones" ADD CONSTRAINT "capacitaciones_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capacitaciones" ADD CONSTRAINT "capacitaciones_capacitador_id_usuarios_id_fk" FOREIGN KEY ("capacitador_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registros_capacitacion" ADD CONSTRAINT "registros_capacitacion_capacitacion_id_capacitaciones_id_fk" FOREIGN KEY ("capacitacion_id") REFERENCES "public"."capacitaciones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registros_capacitacion" ADD CONSTRAINT "registros_capacitacion_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permisos" ADD CONSTRAINT "role_permisos_rol_id_roles_id_fk" FOREIGN KEY ("rol_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permisos" ADD CONSTRAINT "role_permisos_permiso_id_permisos_id_fk" FOREIGN KEY ("permiso_id") REFERENCES "public"."permisos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios_roles" ADD CONSTRAINT "usuarios_roles_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios_roles" ADD CONSTRAINT "usuarios_roles_rol_id_roles_id_fk" FOREIGN KEY ("rol_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios_roles" ADD CONSTRAINT "usuarios_roles_asignado_por_usuario_id_usuarios_id_fk" FOREIGN KEY ("asignado_por_usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;