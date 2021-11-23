const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    try {
        const URL = 'http://www.sped.fazenda.gov.br/spedtabelas/AppConsulta/publico/aspx/ConsultaTabelasExternas.aspx?CodSistema=SpedFiscal'
        const browser = await puppeteer.launch({ headless: false })
        const page = await browser.newPage()

        await page.goto(URL)
        await page.select('#ctl00_ContentPlaceHolder1_ddlPacotes', '17')
        await page.waitForTimeout(100)

        const values = [131, 170, 714, 1318, 841]
        let data = []

        for (const value of values) {
            await page.waitForTimeout(500)
            await page.select('#ctl00_ContentPlaceHolder1_ddlTabelas', `${value}`)
            await page.waitForTimeout(1000)

            let buttonFirst = await page.$('#ctl00_ContentPlaceHolder1_grdConteudo > tbody > tr:nth-child(12) > td > table > tbody > tr > td:nth-child(1) > a')
            let buttonFirst2 = await page.$('#ctl00_ContentPlaceHolder1_grdConteudo > tbody > tr:nth-child(36) > td > table > tbody > tr > td:nth-child(1) > a')
            if (buttonFirst || buttonFirst2) {
                await page.evaluate(() => {
                    javascript:__doPostBack('ctl00$ContentPlaceHolder1$grdConteudo', 'Page$1')
                })
            }

            let buttons = await page.$$('#ctl00_ContentPlaceHolder1_grdConteudo > tbody > tr > td a')
            let btnLength = buttons.length
            let pagesToScrape = btnLength
            let currentPage = 1;
            let index = 2;

            while (currentPage <= pagesToScrape + 1) {
                await page.waitForTimeout(100)
                const tdata1 = await page.evaluate(() => {
                    let lines = Array.from(document.querySelectorAll('#ctl00_ContentPlaceHolder1_grdConteudo > tbody > tr > td:not([colspan="4"]')).map(x => x.textContent)
                    let groups = []
                    let table = []

                    while (lines.length > 0) {
                        groups.push(lines.splice(0, 4))
                    }

                    let tableName = document.querySelector('#ctl00_ContentPlaceHolder1_lblNomeTabela').textContent.slice(20)
                    let codNumber = tableName.match('^(?:[1-9]\.){1,2}(?:[1-9])')? tableName.match('^(?:[1-9]\.){1,2}(?:[1-9])').toString() : null
                    let tableText = tableName.slice(tableName.indexOf('-') + 1).trim()

                    groups.forEach((item) => {
                        table.push({
                            codigoTabela: codNumber,
                            descricaoTabela: tableText,
                            codigo: item[0],
                            descricao: item[1],
                            dataInicio: item[2],
                            dataFim: item[3]
                        })
                    })
                    return table
                })
                data = data.concat(tdata1)
                console.log(tdata1)

                await page.waitForTimeout(100)
                if (currentPage < pagesToScrape + 1) {
                    await page.click(`#ctl00_ContentPlaceHolder1_grdConteudo > tbody > tr:nth-child(52) > td > table > tbody > tr > td:nth-child(${index}) > a`)
                    await page.waitForSelector('#ctl00_ContentPlaceHolder1_grdConteudo > tbody > tr > td')
                    await page.waitForSelector(`#ctl00_ContentPlaceHolder1_grdConteudo > tbody > tr:nth-child(52) > td > table > tbody > tr > td:nth-child(${index}) > a`)
                }
                currentPage++;
                index++;
            }

            if (pagesToScrape === 10 && pagesToScrape !== null) {
                let buttonsMissing = await page.$$('#ctl00_ContentPlaceHolder1_grdConteudo > tbody > tr:nth-child(52) > td > table > tbody > tr > td > a')
                let buttonMissingLength = buttonsMissing.slice(7).length
                let currentPageMissing = 1
                let pagesToScrapeMissing = buttonMissingLength
                let indexMissing = 9

                while (currentPageMissing <= pagesToScrapeMissing) {
                    await page.click(`#ctl00_ContentPlaceHolder1_grdConteudo > tbody > tr:nth-child(52) > td > table > tbody > tr > td:nth-child(${indexMissing}) > a`)
                    await page.waitForSelector('#ctl00_ContentPlaceHolder1_grdConteudo > tbody > tr > td')
                    await page.waitForSelector('#ctl00_ContentPlaceHolder1_grdConteudo > tbody > tr:nth-child(52) > td > table > tbody > tr > td > a')
                    currentPageMissing++;
                    indexMissing++;

                    await page.waitForTimeout(100)
                    if (currentPageMissing < pagesToScrapeMissing + 2) {
                        let newResults2 = await page.evaluate(() => {
                            let lines = Array.from(document.querySelectorAll('#ctl00_ContentPlaceHolder1_grdConteudo > tbody > tr > td:not([colspan="4"]')).map(x => x.textContent)
                            let groups = []
                            let table = []

                            while (lines.length > 0) {
                                groups.push(lines.splice(0, 4))
                            }

                            let tableName = document.querySelector('#ctl00_ContentPlaceHolder1_lblNomeTabela').textContent.slice(20)
                            let codNumber = tableName.match('^(?:[1-9]\.){1,2}(?:[1-9])')? tableName.match('^(?:[1-9]\.){1,2}(?:[1-9])').toString() : null
                            let tableText = tableName.slice(tableName.indexOf('-') + 1).trim()

                            groups.forEach((item) => {
                                table.push({
                                    codigoTabela: codNumber,
                                    descricaoTabela: tableText,
                                    codigo: item[0],
                                    descricao: item[1],
                                    dataInicio: item[2],
                                    dataFim: item[3]
                                })
                            })
                            return table
                        })
                        data = data.concat(newResults2)
                    }
                }
            }
            fs.writeFile('data.json', JSON.stringify(data, null, 2), err => {
                if (err) return console.log(err);
            })
        }
        // await browser.close()
    } catch (error) {
        console.error(error)
    }
})();