import fs from 'fs';
import path from 'path';

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

function loadPlaylistData(): Track[] {
  try {
    const data = fs.readFileSync('playlist_tracks.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier JSON:', error);
    return [];
  }
}

function encodeImageToBase64(imagePath: string): string {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    const extension = path.extname(imagePath).substring(1);
    return `data:image/${extension};base64,${base64}`;
  } catch (error) {
    console.error(`Erreur lors de l'encodage de l'image ${imagePath}:`, error);
    return '';
  }
}

function generatePlaylistSVG(tracks: Track[]): string {
  const width = 550;
  const height = 800;
  const cardHeight = 110;
  const cardMargin = 25;
  const startY = 90;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
    
    <!-- Card shadow filter -->
    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.2"/>
    </filter>
    
    <!-- Glow effect for position numbers -->
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge> 
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>
  
  <!-- Subtitle -->
  <text x="${width/2}" y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="rgba(255,255,255,0.8)">
    My top tracks from Apple Music
  </text>`;

  tracks.forEach((track, index) => {
    const y = startY + index * (cardHeight + cardMargin);
    const cardWidth = width - 40;
    const cardX = 20;
    
    // Card background
    svg += `
  <!-- Card ${index + 1} background -->
  <rect x="${cardX}" y="${y}" width="${cardWidth}" height="${cardHeight}" rx="12" fill="rgba(255,255,255,0.95)" filter="url(#cardShadow)"/>`;
    
    // Position number with glow
    const positionX = cardX + 50;
    const positionY = y + 55;
    svg += `
  <!-- Position number -->
  <circle cx="${positionX}" cy="${positionY}" r="20" fill="#1db954" filter="url(#glow)"/>
  <text x="${positionX}" y="${positionY + 5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white">${track.position}</text>`;
    
    // Artwork
    if (track.artworkSrc && track.artworkSrc !== 'null') {
      const artworkPath = track.artworkSrc.replace('./artwork_images/', 'artwork_images/');
      const base64Image = encodeImageToBase64(artworkPath);
      if (base64Image) {
        svg += `
  <!-- Artwork -->
  <image x="${cardX + 100}" y="${y + 20}" width="70" height="70" href="${base64Image}" style="border-radius: 8px;"/>`;
      }
    }
    
    // Track info
    const infoX = cardX + 200;
    const titleY = y + 35;
    const artistY = y + 55;
    const albumY = y + 75;
    
    // Title
    const title = track.isExplicit ? `${track.title} 🅴` : track.title;
    svg += `
  <!-- Track title -->
  <text x="${infoX}" y="${titleY}" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#333">${title}</text>`;
    
    // Artist
    svg += `
  <!-- Artist -->
  <text x="${infoX}" y="${artistY}" font-family="Arial, sans-serif" font-size="14" fill="#666">${track.artists}</text>`;
    
    // Album
    svg += `
  <!-- Album -->
  <text x="${infoX}" y="${albumY}" font-family="Arial, sans-serif" font-size="12" fill="#888">${track.album}</text>`;
    

  });

  // Footer
  const footerY = height - 20;
  svg += `
  <!-- Footer -->
  <text x="${width/2}" y="${footerY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.6)">
    Last updated: ${new Date().toLocaleDateString('en-EN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}
  </text>
</svg>`;

  return svg;
}

function main() {
  const tracks = loadPlaylistData();
  
  if (tracks.length === 0) {
    console.error('No tracks found in playlist_tracks.json');
    return;
  }
    
  console.log('Generating SVG image...');
  const svg = generatePlaylistSVG(tracks);
  
  const outputPath = 'playlist-top5.svg';
  fs.writeFileSync(outputPath, svg, 'utf8');
  
  console.log(`SVG image saved as ${outputPath}`);
}

main();
