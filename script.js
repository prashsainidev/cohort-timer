const START = new Date('2026-01-17T00:00:00');
const COHORT_DAYS = 180;
const HASHNODE_HOST = 'prashsainidev.hashnode.dev';
const HASHNODE_ENDPOINT = 'https://gql.hashnode.com';

const QUOTES = [
  '"The best time to start was yesterday. The next best time is now."',
  '"Every expert was once a beginner who refused to quit."',
  '"Build in public. Learn in public. Grow in public."',
  '"Consistency beats talent every single time."',
  `"You don't have to be great to start, but you have to start to be great."`,
  '"Code every day. Ship every week. Learn every hour."',
  '"The goal is not to be perfect. The goal is to be better than yesterday."',
  '"Your future self is watching you through your memories. Make them proud."'
];

const daysEl = document.getElementById('days');
const hoursEl = document.getElementById('hours');
const minsEl = document.getElementById('mins');
const secsEl = document.getElementById('secs');
const wavePctEl = document.getElementById('wavePct');
const pctValEl = document.getElementById('pctVal');
const progFillEl = document.getElementById('progFill');
const daysLeftEl = document.getElementById('daysLeft');
const articlesCountEl = document.getElementById('articlesCount');
const quoteEl = document.getElementById('quoteText');
const glow = document.getElementById('cursor-glow');

const msDots = [
  { el: document.getElementById('ms30'), day: 30 },
  { el: document.getElementById('ms60'), day: 60 },
  { el: document.getElementById('ms90'), day: 90 },
  { el: document.getElementById('ms120'), day: 120 },
  { el: document.getElementById('ms150'), day: 150 }
];

const canvas = document.getElementById('sparks');
const ctx = canvas.getContext('2d');
let sparks = [];
let quoteIndex = 0;
let quoteReady = true;
let prevSec = -1;
let fillDone = false;

function pad(n) {
  return String(n).padStart(2, '0');
}

async function fetchArticlesCount() {
  const fallbackCount = articlesCountEl.textContent.trim();
  articlesCountEl.textContent = '...';
  const query = `
    query PublicationPostsCount($host: String!) {
      publication(host: $host) {
        id
        posts(first: 1) {
          totalDocuments
        }
      }
    }
  `;

  try {
    const response = await fetch(HASHNODE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        variables: {
          host: HASHNODE_HOST
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Hashnode request failed with status ${response.status}`);
    }

    const result = await response.json();

    if (result.errors?.length) {
      throw new Error(result.errors[0].message || 'Hashnode GraphQL error');
    }

    const totalDocuments = result?.data?.publication?.posts?.totalDocuments;
    if (typeof totalDocuments === 'number' && Number.isFinite(totalDocuments)) {
      articlesCountEl.textContent = String(totalDocuments);
      return;
    }

    throw new Error('Hashnode article count missing in response');
  } catch (error) {
    console.error('Unable to fetch Hashnode article count:', error);
    articlesCountEl.textContent = fallbackCount;
  }
}

document.addEventListener('mousemove', (event) => {
  glow.style.left = `${event.clientX}px`;
  glow.style.top = `${event.clientY}px`;
});

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}

function spawnSpark() {
  const w = canvas.width;
  const h = canvas.height;

  sparks.push({
    x: Math.random() * w,
    y: h - 44 - Math.random() * 12,
    vx: (Math.random() - 0.5) * 0.8,
    vy: -(1.2 + Math.random() * 2.2),
    life: 1,
    decay: 0.018 + Math.random() * 0.022,
    size: 1.2 + Math.random() * 2
  });
}

function drawSparks() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  sparks.forEach((spark) => {
    ctx.save();
    ctx.globalAlpha = spark.life * 0.85;
    ctx.fillStyle = spark.life > 0.5 ? '#fff' : '#f97316';
    ctx.beginPath();
    ctx.arc(spark.x, spark.y, spark.size * spark.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    spark.x += spark.vx;
    spark.y += spark.vy;
    spark.life -= spark.decay;
  });

  sparks = sparks.filter((spark) => spark.life > 0);

  if (Math.random() < 0.55) {
    spawnSpark();
  }

  requestAnimationFrame(drawSparks);
}

function rotateQuote() {
  if (!quoteReady) {
    return;
  }

  quoteReady = false;
  quoteEl.classList.add('hidden');

  setTimeout(() => {
    quoteIndex = (quoteIndex + 1) % QUOTES.length;
    quoteEl.textContent = QUOTES[quoteIndex];
    quoteEl.classList.remove('hidden');
    quoteReady = true;
  }, 520);
}

function tick() {
  const diff = Date.now() - START.getTime();
  if (diff < 0) {
    return;
  }

  const totalSecs = Math.floor(diff / 1000);
  const s = totalSecs % 60;
  const m = Math.floor(totalSecs / 60) % 60;
  const h = Math.floor(totalSecs / 3600) % 24;
  const d = Math.floor(totalSecs / 86400);

  if (s !== prevSec) {
    secsEl.classList.add('flash');
    setTimeout(() => secsEl.classList.remove('flash'), 140);

    secsEl.textContent = pad(s);
    minsEl.textContent = pad(m);
    hoursEl.textContent = pad(h);
    daysEl.textContent = d;
    prevSec = s;

    const pct = Math.min(100, Math.round((d / COHORT_DAYS) * 100));
    const pctStr = `${pct}%`;
    wavePctEl.textContent = pctStr;
    pctValEl.textContent = pctStr;

    const remaining = Math.max(0, COHORT_DAYS - d);
    daysLeftEl.textContent = remaining;

    if (!fillDone) {
      setTimeout(() => {
        progFillEl.style.width = pctStr;
        fillDone = true;
      }, 600);
    } else {
      progFillEl.style.width = pctStr;
    }

    msDots.forEach((ms) => {
      if (d >= ms.day) {
        ms.el.classList.add('reached');
      } else {
        ms.el.classList.remove('reached');
      }
    });
  }
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

drawSparks();
fetchArticlesCount();
setInterval(rotateQuote, 5000);
tick();
setInterval(tick, 250);
