#!/bin/bash
set -e

APP_ID="cbtest"
BINARY_NAME="cbtest"
VERSION="2.0.007"
PLATFORM="x86_64"
INSTALL_DIR="/usr/local/${APP_ID}"
SRC_DIR="$(cd "$(dirname "$0")" && pwd)/src"
BUILD_DIR="$(cd "$(dirname "$0")" && pwd)/build"

echo "=== Building ${APP_ID}_${VERSION}_${PLATFORM} ==="

# Clean
rm -rf "${BUILD_DIR}/${APP_ID}_${PLATFORM}"
mkdir -p "${BUILD_DIR}/${APP_ID}_${PLATFORM}"

# ── DEBIAN control ──
mkdir -p "${BUILD_DIR}/${APP_ID}_${PLATFORM}/DEBIAN"
cp "${SRC_DIR}/packaging/control" "${BUILD_DIR}/${APP_ID}_${PLATFORM}/DEBIAN/control"
cp "${SRC_DIR}/packaging/postinst" "${BUILD_DIR}/${APP_ID}_${PLATFORM}/DEBIAN/postinst"
chmod 755 "${BUILD_DIR}/${APP_ID}_${PLATFORM}/DEBIAN/postinst"
cp "${SRC_DIR}/packaging/prerm" "${BUILD_DIR}/${APP_ID}_${PLATFORM}/DEBIAN/prerm"
chmod 755 "${BUILD_DIR}/${APP_ID}_${PLATFORM}/DEBIAN/prerm"

# ── App files: /usr/local/cbtest/ ──
mkdir -p "${BUILD_DIR}/${APP_ID}_${PLATFORM}${INSTALL_DIR}"

# Backend binary → bin/ 子目录
mkdir -p "${BUILD_DIR}/${APP_ID}_${PLATFORM}${INSTALL_DIR}/bin"
cp "${SRC_DIR}/backend/cbtest" "${BUILD_DIR}/${APP_ID}_${PLATFORM}${INSTALL_DIR}/bin/cbtest"
chmod +x "${BUILD_DIR}/${APP_ID}_${PLATFORM}${INSTALL_DIR}/bin/cbtest"

# Config.ini
cp "${SRC_DIR}/packaging/config.ini" "${BUILD_DIR}/${APP_ID}_${PLATFORM}${INSTALL_DIR}/config.ini"

# Language file
cp "${SRC_DIR}/packaging/cbtest.lang" "${BUILD_DIR}/${APP_ID}_${PLATFORM}${INSTALL_DIR}/cbtest.lang"

# Icon
mkdir -p "${BUILD_DIR}/${APP_ID}_${PLATFORM}${INSTALL_DIR}/images/icons"
cp "${SRC_DIR}/packaging/images/icons/cbtest.svg" "${BUILD_DIR}/${APP_ID}_${PLATFORM}${INSTALL_DIR}/images/icons/cbtest.svg"

# Systemd service → init.d/ 子目录
mkdir -p "${BUILD_DIR}/${APP_ID}_${PLATFORM}${INSTALL_DIR}/init.d"
cp "${SRC_DIR}/packaging/init.d/cbtest.service" "${BUILD_DIR}/${APP_ID}_${PLATFORM}${INSTALL_DIR}/init.d/cbtest.service"

# Test cases JSON
cp "${SRC_DIR}/test_cases.json" "${BUILD_DIR}/${APP_ID}_${PLATFORM}${INSTALL_DIR}/test_cases.json"

# WebUI: pack into webui.bz2 (GNU tar format)
echo "Packing webui..."
(cd "${SRC_DIR}/webui" && tar --format=gnu -cjf "${BUILD_DIR}/${APP_ID}_${PLATFORM}${INSTALL_DIR}/webui.bz2" index.html app.js styles.css)

# ── Build deb ──
echo "Building deb package..."
dpkg-deb --build "${BUILD_DIR}/${APP_ID}_${PLATFORM}" "${BUILD_DIR}/${APP_ID}_${VERSION}_amd64.deb"

echo ""
echo "✅ Built: ${BUILD_DIR}/${APP_ID}_${VERSION}_amd64.deb"
echo "   Size:  $(du -h "${BUILD_DIR}/${APP_ID}_${VERSION}_amd64.deb" | cut -f1)"
echo ""
echo "Install: dpkg -i ${BUILD_DIR}/${APP_ID}_${VERSION}_amd64.deb"