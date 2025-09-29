import React, { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Avatar } from "@heroui/avatar";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
import { User, Mail, Phone, Shield, Calendar, Building2 } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useUserContext } from "@/contexts/UserContext";

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user } = useUserContext();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">{t("user.loading")}</div>
      </div>
    );
  }

  const handleSave = () => {
    // Here you would typically call an API to update the user profile
    // For now, we'll just exit edit mode
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      fullName: user.fullName,
      email: user.email || "",
      phone: user.phone || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("user.profile")}</h1>
          <p className="text-default-600">{t("profile.subtitle")}</p>
        </div>
        <Button
          color={isEditing ? "danger" : "primary"}
          variant={isEditing ? "bordered" : "solid"}
          onPress={() => {
            if (isEditing) {
              handleCancel();
            } else {
              setIsEditing(true);
            }
          }}
        >
          {isEditing ? t("common.cancel") : t("common.edit")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-col items-center pb-2">
            <Avatar
              className="w-24 h-24 mb-4"
              name={user.fullName}
              size="lg"
            />
            <div className="text-center">
              <h2 className="text-xl font-semibold">{user.fullName}</h2>
              <p className="text-default-600">{user.gradeName}</p>
              <p className="text-small text-default-500">
                {user.militaryNumber}
              </p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-default-500" />
                <span className="text-small">{user.department}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-default-500" />
                <span className="text-small">
                  {t("profile.joinedDate")}: {" "}
                  {user.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div>
                <p className="text-small font-medium mb-2">{t("user.roles")}:</p>
                <div className="flex flex-wrap gap-1">
                  {user.roles?.map((role) => (
                    <Chip
                      key={role.id}
                      color="primary"
                      size="sm"
                      startContent={<Shield size={12} />}
                      variant="flat"
                    >
                      {role.name}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Profile Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User size={20} />
              <h3 className="text-lg font-semibold">{t("profile.personalInfo")}</h3>
            </div>
          </CardHeader>
          <CardBody className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                isReadOnly={!isEditing}
                label={t("user.fullName")}
                labelPlacement="outside"
                startContent={<User size={16} className="text-default-500" />}
                value={isEditing ? formData.fullName : user.fullName}
                variant={isEditing ? "bordered" : "flat"}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
              />
              <Input
                isReadOnly
                label={t("user.militaryNumber")}
                labelPlacement="outside"
                startContent={<Shield size={16} className="text-default-500" />}
                value={user.militaryNumber}
                variant="flat"
              />
              <Input
                isReadOnly
                label={t("user.grade")}
                labelPlacement="outside"
                startContent={<Shield size={16} className="text-default-500" />}
                value={user.gradeName}
                variant="flat"
              />
              <Input
                isReadOnly
                label={t("user.department")}
                labelPlacement="outside"
                startContent={<Building2 size={16} className="text-default-500" />}
                value={user.department}
                variant="flat"
              />
            </div>

            <Divider />

            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="text-medium font-semibold">{t("profile.contactInfo")}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  isReadOnly={!isEditing}
                  label={t("user.email")}
                  labelPlacement="outside"
                  startContent={<Mail size={16} className="text-default-500" />}
                  type="email"
                  value={isEditing ? formData.email : (user.email || "")}
                  variant={isEditing ? "bordered" : "flat"}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
                <Input
                  isReadOnly={!isEditing}
                  label={t("user.phone")}
                  labelPlacement="outside"
                  startContent={<Phone size={16} className="text-default-500" />}
                  value={isEditing ? formData.phone : (user.phone || "")}
                  variant={isEditing ? "bordered" : "flat"}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>

            {isEditing && (
              <>
                <Divider />
                <div className="flex gap-2 justify-end">
                  <Button
                    color="danger"
                    variant="bordered"
                    onPress={handleCancel}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    color="primary"
                    onPress={handleSave}
                  >
                    {t("common.save")}
                  </Button>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}