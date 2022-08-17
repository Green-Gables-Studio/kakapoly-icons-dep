import Database from "../database";
import fs from "fs";
import { nanoid } from "nanoid";

async function importHeroicons() {
  try {
    const db = await Database.get()!;

    const iconSetDocument = await db.iconSets.insert({
      id: nanoid(),
      name: "heroicons",
      slug: "heroicons",
      projectUrl: "https://heroicons.com/",
      figmaFileUrl: "https://www.figma.com/community/file/958423903283802665",
      currentVersion: "1.0.6",
      icons: [],
    });

    const outlineIconFilenames = fs.readdirSync("icons/heroicons/outline");
    const outlineIconIds: string[] = [];
    for (const outlineIconFilename of outlineIconFilenames) {
      const iconFileBuffer = fs.readFileSync(
        `icons/heroicons/outline/${outlineIconFilename}`
      );
      const svg = iconFileBuffer.toString();
      const icon = await db.icons.insert({
        id: nanoid(),
        name: outlineIconFilename,
        iconSet: iconSetDocument.id,
        svg,
      });
      outlineIconIds.push(icon.id);
    }

    const solidIconFilenames = fs.readdirSync("icons/heroicons/solid");
    const solidIconIds: string[] = [];
    for (const solidIconFilename of solidIconFilenames) {
      const iconFileBuffer = fs.readFileSync(
        `icons/heroicons/outline/${solidIconFilename}`
      );
      const svg = iconFileBuffer.toString();
      const icon = await db.icons.insert({
        id: nanoid(),
        name: solidIconFilename,
        iconSet: iconSetDocument.id,
        svg,
      });
      solidIconIds.push(icon.id);
    }

    await iconSetDocument.update({
      $set: {
        icons: [...outlineIconIds, ...solidIconIds],
      },
    });
  } catch (error) {
    console.log(error);
  }
}

async function importFeather() {
  try {
    const db = await Database.get()!;

    const iconSetDocument = await db.iconSets.insert({
      id: nanoid(),
      name: "feather",
      slug: "feather",
      projectUrl: "https://feathericons.com/",
      figmaFileUrl: "",
      currentVersion: "4.29.0",
      icons: [],
    });

    const iconFilenames = fs.readdirSync("icons/feather");
    const iconIds: string[] = [];

    for (const filename of iconFilenames) {
      const iconFileBuffer = fs.readFileSync(`icons/feather/${filename}`);
      const svg = iconFileBuffer.toString();
      const icon = await db.icons.insert({
        id: nanoid(),
        name: filename,
        iconSet: iconSetDocument.id,
        svg,
      });
      iconIds.push(icon.id);
    }

    await iconSetDocument.update({
      $set: {
        icons: iconIds,
      },
    });
  } catch (error) {
    console.log(error);
  }
}

async function importIonicons() {
  try {
    const db = await Database.get()!;

    const iconSetDocument = await db.iconSets.insert({
      id: nanoid(),
      name: "ionicons",
      slug: "ionicons",
      projectUrl: "https://ionic.io/ionicons",
      figmaFileUrl: "",
      currentVersion: "6.0.2",
      icons: [],
    });

    const iconFilenames = fs.readdirSync("icons/ionicons");
    const iconIds: string[] = [];

    for (const filename of iconFilenames) {
      const iconFileBuffer = fs.readFileSync(`icons/ionicons/${filename}`);
      const svg = iconFileBuffer.toString();
      const icon = await db.icons.insert({
        id: nanoid(),
        name: filename,
        iconSet: iconSetDocument.id,
        svg,
      });
      iconIds.push(icon.id);
    }

    await iconSetDocument.update({
      $set: {
        icons: iconIds,
      },
    });
  } catch (error) {
    console.log(error);
  }
}

async function dump() {
  await Promise.all([importHeroicons(), importFeather(), importIonicons()]);

  const db = await Database.get()!;

  if (!fs.existsSync("database/dump/collections")) {
    await fs.mkdirSync("database/dump/collections");
  }

  db.iconSets.exportJSON().then((iconSets) => {
    const data = JSON.stringify(iconSets, null, 2);
    fs.writeFileSync("database/dump/collections/iconSets.json", data);
  });

  db.icons.exportJSON().then((icons) => {
    const data = JSON.stringify(icons, null, 2);
    fs.writeFileSync("database/dump/collections/icons.json", data);
  });
}

dump();
