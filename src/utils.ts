export async function getArtwork(artist: string, track: string): Promise<string | null> {
    const query = encodeURIComponent(`${artist} ${track}`);
    const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=1`;
  
    try {
      const response = await fetch(url);
      const data: any = await response.json();
  
      const artworkUrl = data.results?.[0]?.artworkUrl100?.replace('100x100', '600x600');
      
      return artworkUrl || null;
    } catch (error) {
      return null;
    }
  }

async function run() {
    const url = await getArtwork("Midnight Grand Orchestra", "Rat A Tat");
    console.log(url);
}

// run();