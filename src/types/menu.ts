export type BadgeType = 'count' | 'live' | 'new' | 'tag';

export interface MenuBadge {
  type: BadgeType;
  value?: string | number;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  badge?: MenuBadge;
  href?: string;
}

export interface MenuGroup {
  id: string;
  label: string;
  items: MenuItem[];
}
