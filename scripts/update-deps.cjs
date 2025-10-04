#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    return execSync(command, { 
      stdio: 'pipe', 
      encoding: 'utf8',
      ...options 
    });
  } catch (error) {
    // 对于 yarn outdated，退出码 1 是正常的（有更新时）
    if (command.includes('yarn outdated') && error.status === 1) {
      return error.stdout || '';
    }
    log(`命令执行失败: ${command}`, 'red');
    log(error.message, 'red');
    return null;
  }
}

function checkOutdated() {
  log('🔍 检查过时的依赖...', 'blue');
  
  const result = execCommand('yarn outdated');
  if (!result) {
    log('❌ 无法检查依赖状态', 'red');
    return false;
  }

  // 检查是否有过时的依赖
  if (result.includes('No outdated packages')) {
    log('✅ 所有依赖都是最新的！', 'green');
    return false;
  }

  log('📦 发现可更新的依赖:', 'yellow');
  console.log(result);

  return true;
}

function updateDependencies(updateType = 'minor') {
  log(`🚀 开始更新依赖 (${updateType})...`, 'blue');
  
  try {
    // 备份 package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const backupPath = path.join(process.cwd(), 'package.json.backup');
    fs.copyFileSync(packageJsonPath, backupPath);
    log('📋 已备份 package.json', 'green');

    // 更新依赖
    let command;
    switch (updateType) {
      case 'patch':
        command = 'yarn upgrade --patch';
        break;
      case 'minor':
        command = 'yarn upgrade --minor';
        break;
      case 'major':
        command = 'yarn upgrade --latest';
        break;
      default:
        command = 'yarn upgrade --minor';
    }

    execCommand(command);
    log('✅ 依赖更新完成', 'green');

    // 构建测试
    log('🔨 构建项目...', 'blue');
    execCommand('yarn build');
    log('✅ 构建成功', 'green');

    // 运行测试
    log('🧪 运行测试...', 'blue');
    execCommand('yarn test');
    log('✅ 测试通过', 'green');

    // 删除备份
    fs.unlinkSync(backupPath);
    log('🗑️ 已删除备份文件', 'green');

    return true;
  } catch (error) {
    log('❌ 更新过程中出现错误', 'red');
    log(error.message, 'red');
    
    // 恢复备份
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const backupPath = path.join(process.cwd(), 'package.json.backup');
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, packageJsonPath);
        fs.unlinkSync(backupPath);
        log('🔄 已恢复原始 package.json', 'yellow');
      }
    } catch (restoreError) {
      log('❌ 无法恢复备份文件', 'red');
    }
    
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  const updateType = args[0] || 'minor';
  const dryRun = args.includes('--dry-run');

  log('🤖 Koishi 依赖更新工具', 'blue');
  log('========================', 'blue');

  if (dryRun) {
    log('🔍 干运行模式 - 仅检查不更新', 'yellow');
    checkOutdated();
    return;
  }

  if (!checkOutdated()) {
    return;
  }

  // 确认更新
  if (!args.includes('--yes')) {
    log('⚠️ 即将更新依赖，这可能会影响项目功能', 'yellow');
    log('使用 --yes 参数自动确认，或使用 --dry-run 仅检查', 'yellow');
    return;
  }

  if (updateDependencies(updateType)) {
    log('🎉 依赖更新完成！', 'green');
    log('请检查更改并提交到版本控制', 'blue');
  } else {
    log('❌ 依赖更新失败', 'red');
    process.exit(1);
  }
}

main();
