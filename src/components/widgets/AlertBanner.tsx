"use client";

import { Alert } from "antd";

interface AlertBannerProps {
  message: string;
  description?: string;
  type?: "success" | "info" | "warning" | "error";
  showIcon?: boolean;
}

export function AlertBanner({ message, description, type = "info", showIcon = true }: AlertBannerProps) {
  return <Alert title={message} description={description} type={type} showIcon={showIcon} />;
}
