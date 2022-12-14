type IconSetAsIconProperty = Omit<IconSet, "icons">;

export type Icon = {
  id: string;
  name: string;
  iconSet: IconSetAsIconProperty;
  svg: string;
};

type IconAsIconSetProperty = Omit<Icon, "iconSet">;

export type IconSet = {
  icons: Array<IconAsIconSetProperty>;
  id: string;
  slug: string;
  name: string;
  projectUrl: string;
  figmaFileUrl: string;
  currentVersion: string;
};

export type IconSets = Array<IconSet>;
