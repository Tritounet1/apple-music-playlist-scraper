import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

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

function loadPlaylistData(): Track[] {
    try {
        const data = fs.readFileSync('playlist_tracks.json', 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lors de la lecture du fichier JSON:', error);
        return [];
    }
}

function generateMusicSection(tracks: Track[]): string {
    if (!tracks || tracks.length === 0) {
        return '';
    }

    let musicSection = '## 🎵 Currently Listening\n\n';
    musicSection += 'My top tracks from Apple Music:\n\n';

    musicSection += '| # | Artwork | Track | Artist | Album |\n';
    musicSection += '|---|---------|-------|--------|-------|\n';

    tracks.forEach((track: Track) => {
        const position = track.position;
        const title = track.title;
        const artists = track.artists;
        const album = track.album;
        const artworkSrc = track.artworkSrc;
        const titleLink = track.titleLink;
        const isExplicit = track.isExplicit;

        const titleWithBadge = isExplicit ? `${title} 🅴` : title;
        const titleLinkMarkdown = `[${titleWithBadge}](${titleLink})`;

        const artworkMarkdown = `<img src="${artworkSrc || ''}" width="50" height="50" alt="${title} artwork">`;

        musicSection += `| ${position} | ${artworkMarkdown} | ${titleLinkMarkdown} | ${artists} | ${album} |\n`;
    });

    musicSection += "\n\n"
    musicSection += `*Playlist url: ${playlistUrl}*\n\n`
    musicSection += `*Last updated: ${new Date().toLocaleDateString('en-EN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })}*\n\n`;

    return musicSection;
}

function readExistingREADME(): string {
    try {
        return fs.readFileSync('../README.md', 'utf8');
    } catch (error) {
        console.error('Erreur lors de la lecture du README:', error);
        return '';
    }
}

function updateREADME(): void {
    const tracks = loadPlaylistData();
    const musicSection = generateMusicSection(tracks);
    
    if (!musicSection) {
        console.log('Aucune donnée de playlist trouvée');
        return;
    }

    let readmeContent = readExistingREADME();
    
    const musicSectionRegex = /## 🎵 Currently Listening[\s\S]*?(?=## |$)/;
    
    if (musicSectionRegex.test(readmeContent)) {
        readmeContent = readmeContent.replace(musicSectionRegex, musicSection);
    } else {
        const contactIndex = readmeContent.indexOf('## Contact');
        if (contactIndex !== -1) {
            readmeContent = readmeContent.slice(0, contactIndex) + musicSection + '\n' + readmeContent.slice(contactIndex);
        } else {
            readmeContent += musicSection;
        }
    }

    try {
        fs.writeFileSync('../README.md', readmeContent, 'utf8');
        console.log('✅ README mis à jour avec succès !');
        console.log(`📊 ${tracks.length} pistes ajoutées à la section musique`);
    } catch (error) {
        console.error('Erreur lors de l\'écriture du README:', error);
    }
}

updateREADME();
