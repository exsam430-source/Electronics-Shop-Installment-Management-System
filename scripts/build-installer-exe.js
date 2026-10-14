const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const releaseDir = path.join(rootDir, 'release', 'MR-SOLVER-Electronics-Shop-win32-x64');
const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';

const csSourceCode = `
using System;
using System.IO;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.ComTypes;

namespace MrSolverInstaller
{
    [ComImport]
    [Guid("00021401-0000-0000-C000-000000000046")]
    internal class ShellLink {}

    [ComImport]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    [Guid("000214F9-0000-0000-C000-000000000046")]
    internal interface IShellLinkW
    {
        void GetPath([Out, MarshalAs(UnmanagedType.LPWStr)] System.Text.StringBuilder pszFile, int cchMaxPath, out IntPtr pfd, int fFlags);
        void GetIDList(out IntPtr ppidl);
        void SetIDList(IntPtr pidl);
        void GetDescription([Out, MarshalAs(UnmanagedType.LPWStr)] System.Text.StringBuilder pszName, int cchMaxName);
        void SetDescription([MarshalAs(UnmanagedType.LPWStr)] string pszName);
        void GetWorkingDirectory([Out, MarshalAs(UnmanagedType.LPWStr)] System.Text.StringBuilder pszDir, int cchMaxPath);
        void SetWorkingDirectory([MarshalAs(UnmanagedType.LPWStr)] string pszDir);
        void GetArguments([Out, MarshalAs(UnmanagedType.LPWStr)] System.Text.StringBuilder pszArgs, int cchMaxPath);
        void SetArguments([MarshalAs(UnmanagedType.LPWStr)] string pszArgs);
        void GetHotkey(out short pwHotkey);
        void SetHotkey(short wHotkey);
        void GetShowCmd(out int piShowCmd);
        void SetShowCmd(int iShowCmd);
        void GetIconLocation([Out, MarshalAs(UnmanagedType.LPWStr)] System.Text.StringBuilder pszIconPath, int cchIconPath, out int piIcon);
        void SetIconLocation([MarshalAs(UnmanagedType.LPWStr)] string pszIconPath, int iIcon);
        void SetRelativePath([MarshalAs(UnmanagedType.LPWStr)] string pszPathRel, int dwReserved);
        void Resolve(IntPtr hwnd, int fFlags);
        void SetPath([MarshalAs(UnmanagedType.LPWStr)] string pszFile);
    }

    class Program
    {
        [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool DeleteFile(string lpFileName);

        static void UnblockAllFiles(string dirPath)
        {
            try
            {
                foreach (string file in Directory.GetFiles(dirPath, "*.*", SearchOption.AllDirectories))
                {
                    try { DeleteFile(file + ":Zone.Identifier"); } catch {}
                }
            }
            catch {}
        }

        static void CreateShortcut(string shortcutPath, string targetExePath, string workingDir, string iconPath, string description)
        {
            try
            {
                IShellLinkW link = (IShellLinkW)new ShellLink();
                link.SetPath(targetExePath);
                link.SetWorkingDirectory(workingDir);
                link.SetDescription(description);
                if (File.Exists(iconPath))
                {
                    link.SetIconLocation(iconPath, 0);
                }
                IPersistFile file = (IPersistFile)link;
                file.Save(shortcutPath, false);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Shortcut creation note: " + ex.Message);
            }
        }

        static void CopyDirectory(string sourceDir, string targetDir)
        {
            Directory.CreateDirectory(targetDir);

            foreach (string file in Directory.GetFiles(sourceDir))
            {
                string fileName = Path.GetFileName(file);
                // Skip the installer itself, temporary files, and stale lock files
                if (fileName.Equals("Setup-Installer.exe", StringComparison.OrdinalIgnoreCase) ||
                    fileName.Equals("mongod.lock", StringComparison.OrdinalIgnoreCase) ||
                    fileName.EndsWith(".tmp", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }
                string destFile = Path.Combine(targetDir, fileName);
                File.Copy(file, destFile, true);
            }

            foreach (string subDir in Directory.GetDirectories(sourceDir))
            {
                string dirName = Path.GetFileName(subDir);
                // If data folder already has database files in target, don't overwrite user database!
                if (dirName.Equals("data", StringComparison.OrdinalIgnoreCase))
                {
                    string targetDataDb = Path.Combine(targetDir, "data", "db");
                    if (Directory.Exists(targetDataDb) && Directory.GetFiles(targetDataDb).Length > 0)
                    {
                        continue;
                    }
                }
                CopyDirectory(subDir, Path.Combine(targetDir, dirName));
            }
        }

        static void Main(string[] args)
        {
            Console.Title = "MR SOLVER Electronics Shop - Setup & Installer";
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("=====================================================================");
            Console.WriteLine("  MR SOLVER LEARNING HUB & SOFTWARE HOUSE");
            Console.WriteLine("  ELECTRONICS SHOP & INSTALLMENT MANAGEMENT SYSTEM");
            Console.WriteLine("  100% Offline Windows Desktop Software Installer");
            Console.WriteLine("=====================================================================");
            Console.ResetColor();
            Console.WriteLine();

            string currentDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\\\', '/');
            string currentExe = Path.Combine(currentDir, "MR-SOLVER-Electronics-Shop.exe");

            // 1. Unblock any Mark-of-the-Web (Zone.Identifier)
            UnblockAllFiles(currentDir);

            string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            string installDir = Path.Combine(localAppData, "Programs", "MR-SOLVER-Electronics-Shop");
            string desktopDir = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
            string startMenuDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Microsoft", "Windows", "Start Menu", "Programs", "MR SOLVER");

            Console.WriteLine("Choose an installation option:");
            Console.WriteLine();
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("  [1] Install to PC (Recommended)");
            Console.ResetColor();
            Console.WriteLine("      Installs to AppData\\\\Programs\\\\MR-SOLVER-Electronics-Shop");
            Console.WriteLine("      Creates Desktop & Start Menu Shortcuts (No Admin rights required)");
            Console.WriteLine();
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("  [2] Portable Mode (Create Shortcut for Current Folder)");
            Console.ResetColor();
            Console.WriteLine("      Keep files where they are and place an icon on Desktop");
            Console.WriteLine();
            Console.ForegroundColor = ConsoleColor.White;
            Console.WriteLine("  [3] Launch Application Immediately");
            Console.ResetColor();
            Console.WriteLine();
            Console.Write("Enter choice [1, 2, or 3] (Default: 1): ");

            string choice = Console.ReadLine();
            if (string.IsNullOrWhiteSpace(choice)) choice = "1";
            choice = choice.Trim();

            if (choice == "2")
            {
                Console.WriteLine();
                Console.ForegroundColor = ConsoleColor.Cyan;
                Console.WriteLine("Creating Desktop Shortcut pointing to current folder...");
                Console.ResetColor();

                string shortcutPath = Path.Combine(desktopDir, "MR SOLVER Electronics Shop.lnk");
                string iconPath = Path.Combine(currentDir, "icon.ico");
                CreateShortcut(shortcutPath, currentExe, currentDir, iconPath, "MR SOLVER Electronics Shop & Installment Management System");

                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("Desktop shortcut created successfully!");
                Console.ResetColor();

                Console.WriteLine();
                Console.Write("Launch application now? (Y/N): ");
                string r = Console.ReadLine();
                if (string.IsNullOrWhiteSpace(r) || r.Trim().Equals("Y", StringComparison.OrdinalIgnoreCase))
                {
                    Process.Start(new ProcessStartInfo(currentExe) { WorkingDirectory = currentDir });
                }
                return;
            }
            else if (choice == "3")
            {
                if (File.Exists(currentExe))
                {
                    Process.Start(new ProcessStartInfo(currentExe) { WorkingDirectory = currentDir });
                }
                return;
            }

            // Choice 1: Standard clean user-space installation
            Console.WriteLine();
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("[1/3] Copying application files to " + installDir + "...");
            Console.ResetColor();

            try
            {
                CopyDirectory(currentDir, installDir);
                UnblockAllFiles(installDir);
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("Files installed successfully.");
                Console.ResetColor();
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("Installation copy note: " + ex.Message);
                Console.ResetColor();
            }

            string targetExe = Path.Combine(installDir, "MR-SOLVER-Electronics-Shop.exe");
            string targetIcon = Path.Combine(installDir, "icon.ico");

            Console.WriteLine();
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("[2/3] Creating Desktop & Start Menu Shortcuts...");
            Console.ResetColor();

            try
            {
                // Desktop Shortcut
                string desktopShortcut = Path.Combine(desktopDir, "MR SOLVER Electronics Shop.lnk");
                CreateShortcut(desktopShortcut, targetExe, installDir, targetIcon, "MR SOLVER Electronics Shop & Installment Management System");

                // Start Menu Shortcut
                Directory.CreateDirectory(startMenuDir);
                string startMenuShortcut = Path.Combine(startMenuDir, "MR SOLVER Electronics Shop.lnk");
                CreateShortcut(startMenuShortcut, targetExe, installDir, targetIcon, "MR SOLVER Electronics Shop & Installment Management System");

                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("Shortcuts created on Desktop and Start Menu!");
                Console.ResetColor();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Shortcut note: " + ex.Message);
            }

            Console.WriteLine();
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("=====================================================================");
            Console.WriteLine("  SETUP COMPLETED SUCCESSFULLY!");
            Console.WriteLine();
            Console.WriteLine("  - Desktop Shortcut created: \\"MR SOLVER Electronics Shop\\"");
            Console.WriteLine("  - Installed Path: " + installDir);
            Console.WriteLine("  - Default Admin Login:");
            Console.WriteLine("      Username: admin");
            Console.WriteLine("      Password: admin123");
            Console.WriteLine();
            Console.WriteLine("  - Local Database: 100% Offline Embedded (Zero Configuration)");
            Console.WriteLine("=====================================================================");
            Console.ResetColor();
            Console.WriteLine();

            Console.Write("Do you want to launch the software now? (Y/N): ");
            string runNow = Console.ReadLine();
            if (string.IsNullOrWhiteSpace(runNow) || runNow.Trim().Equals("Y", StringComparison.OrdinalIgnoreCase))
            {
                if (File.Exists(targetExe))
                {
                    Process.Start(new ProcessStartInfo(targetExe) { WorkingDirectory = installDir });
                }
                else if (File.Exists(currentExe))
                {
                    Process.Start(new ProcessStartInfo(currentExe) { WorkingDirectory = currentDir });
                }
            }
        }
    }
}
`;

function buildInstallerExe() {
  console.log('[Installer Builder] Compiling native Setup-Installer.exe...');
  const csFile = path.join(rootDir, 'Setup-Installer.cs');
  fs.writeFileSync(csFile, csSourceCode, 'utf8');

  const outExe = path.join(releaseDir, 'Setup-Installer.exe');
  const iconPath = path.join(rootDir, 'icon.ico');

  let compileCmd = `"${cscPath}" /nologo /target:exe /optimize+ /out:"${outExe}" "${csFile}"`;
  if (fs.existsSync(iconPath)) {
    compileCmd = `"${cscPath}" /nologo /target:exe /optimize+ /win32icon:"${iconPath}" /out:"${outExe}" "${csFile}"`;
  }

  execSync(compileCmd, { stdio: 'inherit' });
  console.log(`[Installer Builder] Successfully compiled: ${outExe}`);

  if (fs.existsSync(csFile)) {
    fs.unlinkSync(csFile);
  }
}

buildInstallerExe();
