const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');

const git = simpleGit();

const repos = [
    'https://github.com/ngosang/trackerslist',
    'https://github.com/XIU2/TrackersListCollection'
];

async function cloneRepositories() {
    try {
        for (const repo of repos) {
            const repoName = repo.split('/').pop();
            console.log(`开始克隆 ${repoName}...`);
            await git.clone(repo);
            console.log(`${repoName} 克隆完成。`);
        }
    } catch (error) {
        console.error('克隆过程中出现错误:', error);
    }
}

// 配置
const outputFile = 'MergeTrackersTmp.txt';
const excludeFile = 'blacklist.txt';

// 获取当前目录下所有 txt 文件（排除 excludeFile）
function getAllTxtFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            arrayOfFiles = getAllTxtFiles(filePath, arrayOfFiles);
        } else if (
            path.extname(file) === '.txt' &&
            file !== excludeFile &&
            file !== outputFile
        ) {
            arrayOfFiles.push(filePath);
        }
    });

    return arrayOfFiles;
}

// 合并文件内容
function mergeFiles(inputFiles, outputFile) {
    let mergedContent = '';
    const uniqueLines = new Set(); // 用于去重

    inputFiles.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf8');
            content.split('\n').forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine) { // 忽略空行
                    uniqueLines.add(trimmedLine);
                }
            });
            console.log(`已处理: ${file}`);
        } catch (err) {
            console.error(`处理文件 ${file} 时出错: ${err}`);
        }
    });

    // 将去重后的内容合并
    mergedContent = Array.from(uniqueLines).join('\n');

    // 写入输出文件
    fs.writeFileSync(outputFile, mergedContent, 'utf8');
    console.log(`\n合并完成！结果已保存到 ${outputFile}`);
    console.log(`合并了 ${uniqueLines.size} 条唯一记录`);
}


// 对文件内容进行排序
function sortFile(inputFile, outputFile, order, dedup) {
    try {
        // 读取文件内容
        const content = fs.readFileSync(inputFile, 'utf8');

        // 分割为行数组并处理
        let lines = content.split('\n').map(line => line.trim()).filter(line => line);

        // 去重（如果需要）
        if (dedup) {
            const uniqueLines = new Set(lines);
            lines = Array.from(uniqueLines);
            console.log(`去重后剩余行数: ${lines.length}`);
        }

        // 排序
        lines.sort((a, b) => {
            return order === 'asc'
                ? a.localeCompare(b)
                : b.localeCompare(a);
        });

        // 将排序后的内容合并
        const sortedContent = lines.join('\n');

        // 写入输出文件
        fs.writeFileSync(outputFile, sortedContent, 'utf8');

        console.log(`排序完成！排序方式: ${order === 'asc' ? '升序' : '降序'}`);
        console.log(`处理前行数: ${content.split('\n').length}`);
        console.log(`处理后行数: ${lines.length}`);
        console.log(`已保存到: ${outputFile}`);

    } catch (err) {
        console.error(`处理文件时出错: ${err}`);
    }
}


async function processFiles() {
    // 定义文件路径
    const inputFile = path.join(__dirname, 'MergeTrackersTmp.txt');
    const outputFile = path.join(__dirname, 'MergeTrackers.txt');

// 读取输入文件
    fs.readFile(inputFile, 'utf8', (err, data) => {
        if (err) {
            console.error('读取文件时出错:', err);
            return;
        }

        // 处理数据：将所有逗号替换为换行符
        const processedData = data.split(',').join('\n');

        // 写入输出文件
        fs.writeFile(outputFile, processedData, 'utf8', (err) => {
            if (err) {
                console.error('写入文件时出错:', err);
                return;
            }
            console.log('文件处理完成，已保存为 MergeTrackers.txt');


            const inputFile = 'MergeTrackers.txt';
            const outputFile1 = 'MergeTrackers_Deduplicated.txt'; // 可以改为相同的文件名直接覆盖原文件

// 执行排序
            if (fs.existsSync(inputFile)) {
                sortFile(inputFile, outputFile1, 'asc', true);
            } else {
                console.error(`错误: 输入文件 ${inputFile} 不存在`);
            }

        });
    });
}

async function main() {
    await cloneRepositories();
    const allTxtFiles = getAllTxtFiles(process.cwd());
    console.log(`找到 ${allTxtFiles.length} 个 txt 文件需要合并（排除 ${excludeFile}）`);
    mergeFiles(allTxtFiles, outputFile);
    processFiles()
}

main()
