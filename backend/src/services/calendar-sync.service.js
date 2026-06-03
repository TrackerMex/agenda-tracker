import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { capacitaciones, usuarios } from '../db/schema.ts';
import * as googleCalendar from './google-calendar.service.js';
import * as microsoftGraph from './microsoft-graph.service.js';

function getUserTokens(user) {
  return {
    google: {
      accessToken: user.googleAccessToken,
      refreshToken: user.googleRefreshToken,
    },
    outlook: {
      accessToken: user.outlookAccessToken,
      refreshToken: user.outlookRefreshToken,
    },
  };
}

async function persistEventIds(capacitacionId, { googleEventId, outlookEventId }) {
  const values = { updatedAt: sql`now()` };
  if (googleEventId !== undefined) values.googleCalendarEventId = googleEventId;
  if (outlookEventId !== undefined) values.outlookCalendarEventId = outlookEventId;

  if (Object.keys(values).length === 1) return;

  await db.update(capacitaciones).set(values).where(eq(capacitaciones.id, Number(capacitacionId)));
}

async function loadCapacitador(capacitacion) {
  if (!capacitacion.capacitador) {
    const [capacitador] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.id, Number(capacitacion.capacitadorId || capacitacion.capacitador_id)));
    return capacitador || null;
  }
  return null;
}

export async function syncCapacitacion(capacitacion) {
  const capacitador = await loadCapacitador(capacitacion);

  if (!capacitador) {
    console.log(`[calendar-sync] SKIP syncCapacitacion cap=${capacitacion.id} reason="capacitador no encontrado"`);
    return { google: { sent: false }, outlook: { sent: false } };
  }

  const tokens = getUserTokens(capacitador);
  const eventCapacitacion = {
    id: capacitacion.id,
    nombre: capacitacion.nombre,
    descripcion: capacitacion.descripcion,
    fecha: capacitacion.fecha,
    hora_inicio: capacitacion.hora_inicio ?? capacitacion.horaInicio,
    duracion_minutos: capacitacion.duracion_minutos ?? capacitacion.duracionMinutos,
    plataforma: capacitacion.plataforma,
    area: capacitacion.area,
    capacitador: capacitacion.capacitador,
  };

  const existingGoogleId = capacitacion.googleCalendarEventId ?? capacitacion.google_calendar_event_id;
  const existingOutlookId = capacitacion.outlookCalendarEventId ?? capacitacion.outlook_calendar_event_id;

  const [googleResult, outlookResult] = await Promise.all([
    existingGoogleId
      ? googleCalendar.updateEvent({ userTokens: tokens.google, eventId: existingGoogleId, capacitacion: eventCapacitacion })
      : googleCalendar.createEvent({ userTokens: tokens.google, capacitacion: eventCapacitacion }),
    existingOutlookId
      ? microsoftGraph.updateEvent({ userTokens: tokens.outlook, eventId: existingOutlookId, capacitacion: eventCapacitacion })
      : microsoftGraph.createEvent({ userTokens: tokens.outlook, capacitacion: eventCapacitacion }),
  ]);

  const googleEventId = googleResult.eventId !== undefined ? googleResult.eventId : existingGoogleId;
  const outlookEventId = outlookResult.eventId !== undefined ? outlookResult.eventId : existingOutlookId;

  await persistEventIds(capacitacion.id, {
    googleEventId: googleResult.sent ? googleEventId : existingGoogleId,
    outlookEventId: outlookResult.sent ? outlookEventId : existingOutlookId,
  });

  return { google: googleResult, outlook: outlookResult };
}

export async function removeCapacitacion(capacitacion) {
  const capacitador = await loadCapacitador(capacitacion);
  if (!capacitador) {
    console.log(`[calendar-sync] SKIP removeCapacitacion cap=${capacitacion.id} reason="capacitador no encontrado"`);
    return { google: { sent: false }, outlook: { sent: false } };
  }

  const tokens = getUserTokens(capacitador);
  const googleEventId = capacitacion.googleCalendarEventId ?? capacitacion.google_calendar_event_id;
  const outlookEventId = capacitacion.outlookCalendarEventId ?? capacitacion.outlook_calendar_event_id;

  const [googleResult, outlookResult] = await Promise.all([
    googleEventId
      ? googleCalendar.deleteEvent({ userTokens: tokens.google, eventId: googleEventId })
      : Promise.resolve({ sent: false, reason: 'sin eventId' }),
    outlookEventId
      ? microsoftGraph.deleteEvent({ userTokens: tokens.outlook, eventId: outlookEventId })
      : Promise.resolve({ sent: false, reason: 'sin eventId' }),
  ]);

  await persistEventIds(capacitacion.id, {
    googleEventId: null,
    outlookEventId: null,
  });

  return { google: googleResult, outlook: outlookResult };
}

export function getCalendarSyncStatus() {
  return {
    google: googleCalendar.getGoogleStatus(),
    outlook: microsoftGraph.getMicrosoftStatus(),
  };
}
