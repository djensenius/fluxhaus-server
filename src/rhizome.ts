import 'dotenv/config';
import fs from 'fs';

interface GitHubFile {
  name: string;
  download_url: string;
}

export default class Rhizome {
  static fetchSchedule = async () => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    fetch(`https://us-central1-com-dogtopia-app.cloudfunctions.net/executive/appointments/daycare/${process.env.DOGTOPIA_SCHEDULE_CODE}?startDate=${startDate.getTime()}&endDate=${endDate.getTime()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Sec-Fetch-Site': 'cross-site',
        'Accept-Language': 'en-CA,en-US;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Sec-Fetch-Mode': 'cors',
        Host: 'us-central1-com-dogtopia-app.cloudfunctions.net',
        Origin: 'https://www.dogtopia.com',
        // eslint-disable-next-line max-len
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
        Referer: 'https://www.dogtopia.com/',
        Connection: 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        Priority: 'u=3, i',
        Authorization: `Bearer ${process.env.DOGTOPIA_TOKEN}`,
      },
    }).then((response) => response.json())
      .then((json) => {
        fs.writeFileSync(
          'cache/rhizome.json',
          JSON.stringify({ timestamp: new Date(), ...json }, null, 2),
        );
      });
  };

  static fetchRhizomePhotos = async () => {
    const newsURL = 'https://raw.githubusercontent.com/djensenius/Rhizome-Data/main/news.md';
    fetch('https://api.github.com/repos/djensenius/Rhizome-Data/contents/photos?ref=main')
      .then((response) => response.json())
      .then((json) => {
        const photos = json.map((file: GitHubFile) => file.download_url);
        fs.writeFileSync(
          'cache/rhizomePhotos.json',
          JSON.stringify({ timestamp: new Date(), news: newsURL, photos: [...photos] }, null, 2),
        );
      });
  };

  static schedule = async (dropoff: Date, pickup: Date) => {
    const { DOGTOPIA_SCHEDLUE_URL, DOGTOPIA_TOKEN } = process.env;
    let { DOGTOPIA_SCHEDULE_REQUEST } = process.env;
    const currentTime = Math.floor(Date.now() / 1000);
    let hours = dropoff.getHours().toString().padStart(2, '0');
    let minutes = dropoff.getMinutes().toString().padStart(2, '0');
    const localDropoffTime = `${hours}:${minutes}`;
    hours = pickup.getHours().toString().padStart(2, '0');
    minutes = pickup.getMinutes().toString().padStart(2, '0');
    const localPickupTime = `${hours}:${minutes}`;
    const fullDropoffTime = Math.floor(dropoff.valueOf() / 1000);
    const fullPickupTime = Math.floor(pickup.valueOf() / 1000);

    DOGTOPIA_SCHEDULE_REQUEST = DOGTOPIA_SCHEDULE_REQUEST!.replace('CREATED_AT', currentTime.toString());
    DOGTOPIA_SCHEDULE_REQUEST = DOGTOPIA_SCHEDULE_REQUEST.replace('DATE', fullDropoffTime.toString());
    DOGTOPIA_SCHEDULE_REQUEST = DOGTOPIA_SCHEDULE_REQUEST.replace('PICKUP_DATE', fullPickupTime.toString());
    DOGTOPIA_SCHEDULE_REQUEST = DOGTOPIA_SCHEDULE_REQUEST.replace('DROPOFF_TIME', encodeURIComponent(localDropoffTime));
    DOGTOPIA_SCHEDULE_REQUEST = DOGTOPIA_SCHEDULE_REQUEST.replace('PICKUP_TIME', encodeURIComponent(localPickupTime));
    // Now I need to use DOGTOPIA_SCHEDLUE_URL to send the request with DOGTOPIA_SCHEDULE_REQUEST as the body
    fetch(DOGTOPIA_SCHEDLUE_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Sec-Fetch-Site': 'cross-site',
        'Accept-Language': 'en-CA,en-US;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Sec-Fetch-Mode': 'cors',
        Host: 'us-central1-com-dogtopia-app.cloudfunctions.net',
        Origin: 'https://www.dogtopia.com',
        // eslint-disable-next-line max-len
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
        Referer: 'https://www.dogtopia.com/',
        Connection: 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        Priority: 'u=3, i',
        Authorization: `Bearer ${DOGTOPIA_TOKEN}`,
      },
      body: DOGTOPIA_SCHEDULE_REQUEST,
    }).then((response) => {
        console.log(DOGTOPIA_SCHEDULE_REQUEST);
        console.log(response);
    });
  };
}
