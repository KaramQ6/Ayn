import TelegramBot from 'node-telegram-bot-api';
import { crossValidate } from '../services/alertEngine.js';
import { analyzePhoto } from '../services/visionAI.js';
import { findNearestForest } from '../data/forests.js';

let bot = null;

export function initBot(db, broadcast) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token === 'your_telegram_bot_token_here') return;

  bot = new TelegramBot(token, { polling: true });

  // /start command
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId,
      `🌳 *مرحباً بك في ForestGuard AI!*\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `نظام حماية الغابات الذكي — الشرق الأوسط وشمال أفريقيا\n\n` +
      `🔹 /report — الإبلاغ عن تهديد\n` +
      `🔹 /status — حالة الغابات الآن\n` +
      `🔹 /alerts — آخر التنبيهات\n` +
      `🔹 /register — تسجيل كحارس غابات\n\n` +
      `📸 يمكنك أيضاً إرسال صورة مباشرة للإبلاغ!`,
      { parse_mode: 'Markdown' }
    );
  });

  // /report command
  bot.onText(/\/report/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId,
      `📝 *إبلاغ عن تهديد للغابات*\n\n` +
      `اختر نوع التهديد:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔥 حريق', callback_data: 'report_fire' }, { text: '🪓 قطع أشجار', callback_data: 'report_logging' }],
            [{ text: '🏜️ تصحر', callback_data: 'report_desertification' }, { text: '🗑️ تلوث', callback_data: 'report_pollution' }],
            [{ text: '🦅 حيوان مهدد', callback_data: 'report_wildlife' }, { text: '❓ أخرى', callback_data: 'report_other' }],
          ],
        },
      }
    );
  });

  // Handle report type selection
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data.startsWith('report_')) {
      const reportType = data.replace('report_', '');
      const typeNames = {
        fire: '🔥 حريق',
        logging: '🪓 قطع أشجار',
        desertification: '🏜️ تصحر',
        pollution: '🗑️ تلوث',
        wildlife: '🦅 حيوان مهدد',
        other: '❓ أخرى',
      };

      // Store pending report type — insert a new report row
      const result = db.prepare(`
        INSERT INTO reports (telegram_user_id, username, report_type, status)
        VALUES (?, ?, ?, 'awaiting_location')
      `).run(String(chatId), query.from.username || query.from.first_name, reportType);

      bot.answerCallbackQuery(query.id);
      bot.sendMessage(chatId,
        `✅ نوع التهديد: *${typeNames[reportType]}*\n\n` +
        `📍 الآن أرسل *موقعك* (اضغط 📎 → الموقع)\n` +
        `أو أرسل *صورة* مع الموقع`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{ text: '📍 إرسال موقعي', request_location: true }]],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        }
      );
    }

    if (data === 'alert_resolved') {
      bot.answerCallbackQuery(query.id, { text: '✅ تم تسجيل الاستجابة' });
      bot.sendMessage(chatId, '✅ شكراً! تم تسجيل استجابتك.');
    }
  });

  // Handle location
  bot.on('location', (msg) => {
    const chatId = msg.chat.id;
    const { latitude, longitude } = msg.location;

    // Update pending report — find the latest awaiting_location report for this user
    const pendingReport = db.prepare(`
      SELECT id FROM reports
      WHERE telegram_user_id = ? AND status = 'awaiting_location'
      ORDER BY id DESC LIMIT 1
    `).get(String(chatId));

    if (pendingReport) {
      // Detect country from coordinates
      const nearestResult = findNearestForest(latitude, longitude);
      const country = nearestResult?.forest?.country || null;

      db.prepare(`
        UPDATE reports SET latitude = ?, longitude = ?, country = ?, status = 'pending'
        WHERE id = ?
      `).run(latitude, longitude, country, pendingReport.id);

      const report = db.prepare(`
        SELECT * FROM reports WHERE telegram_user_id = ? ORDER BY id DESC LIMIT 1
      `).get(String(chatId));

      // Award points
      db.prepare('UPDATE reports SET points_awarded = 10 WHERE id = ?').run(report.id);

      // Cross-validate with other sources
      const aiAnalysis = report.ai_analysis ? JSON.parse(report.ai_analysis) : null;
      const crossValType = (aiAnalysis && (aiAnalysis.hasFire || aiAnalysis.hasSmoke) && aiAnalysis.threatConfidence > 70)
        ? 'AI_VISION' : 'COMMUNITY';

      crossValidate(db, broadcast, {
        type: crossValType,
        latitude,
        longitude,
        aiConfidence: aiAnalysis?.threatConfidence || 0,
        aiThreatType: aiAnalysis?.threatType || 'none',
      });

      // Broadcast to dashboard
      broadcast({ type: 'NEW_REPORT', data: report });

      // Find nearest forest using registry
      const nearest = nearestResult;
      const forestName = nearest ? nearest.forest.nameAr : 'غابة غير محددة';
      const forestDist = nearest ? nearest.distance.toFixed(1) : '?';

      bot.sendMessage(chatId,
        `✅ *تم استلام بلاغك!*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `📍 الموقع: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}\n` +
        `🌳 أقرب غابة: ${forestName} (${forestDist} كم)\n` +
        `🏆 +10 نقاط\n\n` +
        `سيتم التحقق من بلاغك مع بيانات الأقمار الصناعية. شكراً لمساهمتك! 🙏`,
        { parse_mode: 'Markdown', reply_markup: { remove_keyboard: true } }
      );
    }
  });

  // Handle photo — AI-enhanced quick report
  bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const photo = msg.photo[msg.photo.length - 1]; // highest resolution
    const fileId = photo.file_id;

    // Save report immediately so user gets fast feedback
    const result = db.prepare(`
      INSERT INTO reports (telegram_user_id, username, photo_url, report_type, status)
      VALUES (?, ?, ?, 'unknown', 'awaiting_location')
    `).run(String(chatId), msg.from.username || msg.from.first_name, fileId);

    const reportId = result.lastInsertRowid;

    bot.sendMessage(chatId,
      `📸 تم استلام الصورة!\n🤖 _جاري تحليل الصورة بالذكاء الاصطناعي..._`,
      { parse_mode: 'Markdown' }
    );

    // Run AI analysis in background
    try {
      // Get the file URL from Telegram
      let imageSource;
      try {
        const fileLink = await bot.getFileLink(fileId);
        imageSource = fileLink;
      } catch (_) {
        // If we can't get the link, use demo analysis
        imageSource = null;
      }

      const analysis = imageSource ? await analyzePhoto(imageSource) : await analyzePhoto(Buffer.alloc(0));

      // Update report with AI results
      db.prepare(`
        UPDATE reports SET
          ai_classification = ?,
          ai_confidence = ?,
          ai_analysis = ?,
          report_type = CASE WHEN report_type = 'unknown' THEN ? ELSE report_type END
        WHERE id = ?
      `).run(
        analysis.threatType,
        analysis.threatConfidence,
        JSON.stringify(analysis),
        analysis.threatType !== 'none' ? analysis.threatType : 'unknown',
        reportId
      );

      // Build AI result message for user
      const threatEmojis = { fire: '🔥', smoke: '💨', logging: '🪓', none: '✅', unknown: '❓' };
      const threatNames  = { fire: 'حريق', smoke: 'دخان', logging: 'قطع أشجار', none: 'لا تهديد', unknown: 'غير معروف' };

      let aiMsg = `🤖 *نتائج تحليل الذكاء الاصطناعي:*\n━━━━━━━━━━━━━━━━━━━━━\n`;
      aiMsg += `${threatEmojis[analysis.threatType] || '❓'} التصنيف: *${threatNames[analysis.threatType] || analysis.threatType}*\n`;
      aiMsg += `📊 نسبة الثقة: *${analysis.threatConfidence}%*\n`;

      if (analysis.labels?.length > 0) {
        aiMsg += `🏷️ العناصر: ${analysis.labels.slice(0, 5).map(l => l.name).join(', ')}\n`;
      }

      if ((analysis.hasFire || analysis.hasSmoke) && analysis.threatConfidence > 70) {
        aiMsg += `\n⚠️ *تهديد محتمل تم اكتشافه!* سيتم التحقق المتقاطع تلقائياً عند إرسال الموقع.`;
      }

      aiMsg += `\n\n📍 الآن أرسل *موقعك* لإكمال البلاغ:`;

      bot.sendMessage(chatId, aiMsg, {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [[{ text: '📍 إرسال موقعي', request_location: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });

      // If high-confidence threat and location is available from the message
      if ((analysis.hasFire || analysis.hasSmoke) && analysis.threatConfidence > 70 && msg.location) {
        crossValidate(db, broadcast, {
          type: 'AI_VISION',
          latitude: msg.location.latitude,
          longitude: msg.location.longitude,
          aiConfidence: analysis.threatConfidence,
          aiThreatType: analysis.threatType,
        });
      }
    } catch (err) {
      console.error('AI photo analysis failed:', err.message);
      // Fallback — still ask for location
      bot.sendMessage(chatId,
        `📸 تم استلام الصورة!\n📍 الآن أرسل *موقعك* لإكمال البلاغ:`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{ text: '📍 إرسال موقعي', request_location: true }]],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        }
      );
    }
  });

  // /status command — shows all monitored forests (top risks first)
  bot.onText(/\/status/, (msg) => {
    const chatId = msg.chat.id;
    const risks = db.prepare(`
      SELECT * FROM fire_risk
      WHERE id IN (SELECT MAX(id) FROM fire_risk GROUP BY region)
      ORDER BY risk_score DESC
      LIMIT 20
    `).all();

    if (risks.length === 0) {
      bot.sendMessage(chatId, '⚠️ لا توجد بيانات متاحة حالياً');
      return;
    }

    let statusMsg = `🌳 *حالة الغابات المراقبة*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const r of risks) {
      const emoji = r.risk_score >= 80 ? '🔴' : r.risk_score >= 50 ? '🟠' : r.risk_score >= 30 ? '🟡' : '🟢';
      statusMsg += `${emoji} ${r.region}\n   خطر: ${r.risk_score}/100 | 🌡️ ${r.temperature?.toFixed(0)}°C | 💧 ${r.humidity?.toFixed(0)}%\n\n`;
    }

    bot.sendMessage(chatId, statusMsg, { parse_mode: 'Markdown' });
  });

  // /alerts command
  bot.onText(/\/alerts/, (msg) => {
    const chatId = msg.chat.id;
    const alerts = db.prepare(`
      SELECT * FROM alerts WHERE resolved = 0
      ORDER BY created_at DESC LIMIT 5
    `).all();

    if (alerts.length === 0) {
      bot.sendMessage(chatId, '✅ لا توجد تنبيهات نشطة حالياً 🌿');
      return;
    }

    let alertMsg = `🚨 *آخر التنبيهات*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const a of alerts) {
      alertMsg += `${a.message}\n📅 ${a.created_at}\n\n`;
    }
    bot.sendMessage(chatId, alertMsg, { parse_mode: 'Markdown' });
  });

  // /register — register as ranger
  bot.onText(/\/register/, (msg) => {
    const chatId = msg.chat.id;
    const existing = db.prepare('SELECT * FROM rangers WHERE telegram_chat_id = ?').get(String(chatId));
    if (existing) {
      bot.sendMessage(chatId, '✅ أنت مسجل بالفعل كحارس غابات!');
      return;
    }
    db.prepare('INSERT INTO rangers (telegram_chat_id, name) VALUES (?, ?)').run(String(chatId), msg.from.first_name);
    bot.sendMessage(chatId, `🛡️ تم تسجيلك كحارس غابات، ${msg.from.first_name}!\nستتلقى تنبيهات فورية عند اكتشاف أي تهديد. 🌳`);
  });

  console.log('🤖 Telegram Bot ready!');
  return bot;
}

// Send alert to all registered rangers
export function notifyRangers(db, alertData) {
  if (!bot) return;
  const rangers = db.prepare('SELECT * FROM rangers WHERE active = 1').all();

  for (const ranger of rangers) {
    bot.sendMessage(ranger.telegram_chat_id,
      `🚨 *ForestGuard Alert — ${alertData.level}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `${alertData.message}\n` +
      `📍 ${alertData.latitude?.toFixed(4)}, ${alertData.longitude?.toFixed(4)}\n` +
      `🛰️ المصادر: ${alertData.sources}\n` +
      `━━━━━━━━━━━━━━━━━━━━━`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ تم التعامل', callback_data: 'alert_resolved' }],
          ],
        },
      }
    );
  }
}
