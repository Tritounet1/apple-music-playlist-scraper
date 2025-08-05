import puppeteer from "puppeteer";
import fs from 'fs';
import path from 'path';
import https from 'https';
import dotenv from 'dotenv'

dotenv.config();

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const playlistUrl = process.env.PLAYLIST_URL;

if(!playlistUrl) {
    console.error("Please provide the playlist url.");
    process.exit(0);
}

interface Track {
  position: number;
  title: string;
  titleLink: string;
  artists: string;
  artistLinks: string[];
  album: string;
  albumLink: string;
  duration: string;
  artworkSrc: string | null;
  isExplicit: boolean;
}

async function downloadImage(url: string, filepath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(filepath);
        });
      } else {
        reject(new Error(`Erreur HTTP: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function scrapeAppleMusicPlaylist(numberOfTracks: number = 5): Promise<void> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();
    
    console.log('Navigation vers la playlist...');
    await page.goto(playlistUrl!, { waitUntil: 'networkidle2' });
    
    console.log('Attente du chargement du contenu...');
    await sleep(5000);
    
    await page.waitForSelector('[data-testid="track-list-item"]', { timeout: 10000 });
    
    const imagesDir = "./artwork_images";
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    
    const tracks: Track[] = await page.evaluate((maxTracks: number) => {
      const trackItems = document.querySelectorAll('[data-testid="track-list-item"]');
      const tracksData: Track[] = [];
      
      for (let i = 0; i < Math.min(trackItems.length, maxTracks); i++) {
        const track = trackItems[i];
        
        const titleElement = track.querySelector('[data-testid="track-title"]');
        const title = titleElement ? titleElement.textContent?.trim() || '' : '';
        
        const titleLink = (titleElement?.closest('a') as HTMLAnchorElement)?.href || '';
        
        const byLineElement = track.querySelector('[data-testid="track-title-by-line"]');
        const artists = byLineElement ? byLineElement.textContent?.trim() || '' : '';
        
        const albumElement = track.querySelector('[data-testid="track-column-tertiary"] a');
        const album = albumElement ? albumElement.textContent?.trim() || '' : '';
        const albumLink = (albumElement as HTMLAnchorElement)?.href || '';
        
        const durationElement = track.querySelector('[data-testid="track-duration"]');
        const duration = durationElement ? durationElement.textContent?.trim() || '' : '';
        
        const pictureElement = track.querySelector('[data-testid="artwork-component"] picture');
        let artworkSrc = '';
        if (pictureElement) {
          const sourceElement = pictureElement.querySelector('source[type="image/webp"]') as HTMLSourceElement;
          if (sourceElement && sourceElement.srcset) {
            const srcset = sourceElement.srcset;
            const urls = srcset.split(',').map(s => s.trim().split(' ')[0]);
            artworkSrc = urls[urls.length - 1];
          }
        }
        
        const explicitBadge = track.querySelector('[data-testid="explicit-badge"]');
        const isExplicit = !!explicitBadge;
        
        const artistLinks = Array.from(track.querySelectorAll('[data-testid="track-title-by-line"] a')).map(a => (a as HTMLAnchorElement).href);
        
        tracksData.push({
          position: i + 1,
          title,
          titleLink,
          artists,
          artistLinks,
          album,
          albumLink,
          duration,
          artworkSrc,
          isExplicit
        });
      }
      
      return tracksData;
    }, numberOfTracks);
    
    console.log('Téléchargement des images d\'artwork...');
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      if (track.artworkSrc) {
        try {
          const filename = `artwork_${i + 1}_${track.title.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
          const localPath = path.join(imagesDir, filename);
          
          console.log(`Téléchargement de l'image ${i + 1}: ${track.title}`);
          await downloadImage(track.artworkSrc, localPath);
          
          track.artworkSrc = `./artwork_images/${filename}`;
        } catch (error) {
          console.error(`Erreur lors du téléchargement de l'image pour ${track.title}:`, (error as Error).message);
          track.artworkSrc = null;
        }
      }
    }
    
    console.log(`\nDonnées des ${numberOfTracks} premières pistes:`);
    console.log(JSON.stringify(tracks, null, 2));
    
    fs.writeFileSync('playlist_tracks.json', JSON.stringify(tracks, null, 2));
    console.log('\nDonnées sauvegardées dans playlist_tracks.json');
    
  } catch (error) {
    console.error('Erreur lors du scraping:', error);
  } finally {
    await browser.close();
    console.log('Navigateur fermé.');
  }
}

scrapeAppleMusicPlaylist(5);