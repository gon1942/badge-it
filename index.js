const core = require('@actions/core');
const github = require('@actions/github');
const showdown = require('showdown');
const jsDom = require('jsdom');
const {
	JSDOM
} = jsDom;
const {
	encode,
	decode
} = require('node-encoder');
const util = require('./util');

/**
 * Generates no config badges automatically.
 */
class GenerateBadges {
	constructor() {
		// This.token ='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';
		this.token = core.getInput('GITHUB_TOKEN');
		this.inputBadges = core.getInput('badges');
		this.badgeStyle = core.getInput('badge-style');
		this.badgesLine = core.getInput('badges_line');

		this.octokit = github.getOctokit(this.token);
		this.repoInfo = github.context.repo;
		this.currentBranch = github.context.ref.slice(11);
		this.repoSha = github.context.sha;
		this.action = github.context.payload.action;
		this.mdParser = new showdown.Converter();

		console.log('token==' + this.token);
		console.log('inputBadges==' + this.inputBadges);
		console.log('repoInfo==' + this.repoInfo);
		console.log('badgeLine==' + this.badgeLine);
	}

	_addBadges(content) {
		const badges = util._getBadgeLinks(
			this.inputBadges,
			this.repoInfo,
			this.badgeStyle
		);
		// Console.log('content==' + content);
		console.log('a===' + content.includes('### badgesLine'));

		// If the readme header is in html then don't markdown it.
		// if (content.includes('<h1>')) {

		if (content.includes('<h1 id="badge">')) {
			const {
				window: {
					document
				}
			} = new JSDOM(content);
			const header = document.querySelector('h1:nth-child(1)');

			const newHeader = `<h1 id="badge">${header.textContent} ${badges}</h1>`;
			const updatedReadme = content.replace(header.outerHTML, newHeader).replace(/,/gm, ' ');

			return updatedReadme;
		}

		if (content.includes('### badgesLine')) {
			const htmlContent = this.mdParser.makeHtml('# badge');
			const {
				window: {
					document
				}
			} = new JSDOM(htmlContent);
			const headerBadge = document.querySelector('h1:nth-child(1)');
			const newHeader = `<h1 id="badge">${headerBadge.textContent} ${badges}</h1>`;

			console.log('headerBadge===' + headerBadge.outerHTML);

			// Const updatedReadme = newHeader + '  ' + content.replace(/,/gm, ' ');
			const updatedReadme = newHeader + '  ' + content.replace(headerBadge.outerHTML, newHeader).replace(/,/gm, ' ');

			// Const header = document.createElement('h1');
			// const headerMd = this.mdParser.makeMarkdown(header.outerHTML, document);
			// console.log('headerMd===' + headerMd);

			// document.querySelector('#badges').textContent = '';
			// const newHeader = `<h1 id="badges">${badges}</h1>`;
			// const newHeaderMd = this.mdParser.makeMarkdown(newHeader, document).replace(/,/gm, ' ');
			// const updatedReadme = content.replace(headerMd, newHeaderMd) + '<br>  ' + newHeaderMd;
			// console.log('updatedReadme===' + updatedReadme);

			return updatedReadme;
		}

		console.log('#### Don\'t Run... check default Values(\'### badges_line\')####');

		const htmlContent = this.mdParser.makeHtml('# content');
		const {
			window: {
				document
			}
		} = new JSDOM(htmlContent);

		const header = document.querySelector('h1:nth-child(1)');
		let headerMd = '';
		let updatedReadme = '';
		console.log('1112=============qew==========++' + header.outerHTML);
		console.log('aasdasd====' + document.querySelector('#content').textContent);
		if (document.querySelector('#content')) {
			console.log('111111111111');
			document.querySelector('#content').textContent = '';
			document.querySelector('#content').textContent = `${badges}`;

			headerMd = this.mdParser.makeMarkdown(header.outerHTML, document);
			console.log('headerMd===' + headerMd);
			console.log('headerMd= outhtml==' + headerMd.outerHTML);

			console.log('header.outerHTML==wwwwwwwwww=' + header.outerHTML);

			const newHeader = header.outerHTML;
			const newHeaderMd = this.mdParser
				.makeMarkdown(newHeader, document)
				.replace(/,/gm, ' ');
			console.log('newHeaderMd=ssssssssssssssssssssssssss==' + newHeaderMd);

			// Const updatedReadme = newHeaderMd + '  ' + content;
			updatedReadme = content.replace(headerMd, newHeaderMd);
			// Const updatedReadme = content;

			console.log('updatedReadme===' + updatedReadme);
		} else {
			// If header is in markfdown then make it html
			// console.log('header.outerHTML===' + header.outerHTML);
			console.log('222222222222');
			document.querySelector('#content').textContent = `${badges}`;
			console.log('h1Text===' + document.querySelector('#content').textContent);
			// Console.log('headerMdouterHTML==' + header.outerHTML);

			console.log('header.outerHTML==wwwwwwwwww=' + header.outerHTML);

			const newHeader = header.outerHTML;
			const newHeaderMd = this.mdParser
				.makeMarkdown(newHeader, document)
				.replace(/,/gm, ' ');
			console.log('newHeaderMd=ssssssssssssssssssssssssss==' + newHeaderMd);

			updatedReadme = newHeaderMd + '  ' + content;
			// Const updatedReadme = content.replace(headerMd, newHeaderMd);
			// Const updatedReadme = content;

			console.log('updatedReadme===' + updatedReadme);
		}

		// Const aa = document.all.Header.innerHTML = 'Here\'s a New Header!';
		return updatedReadme;
	}

	_getReadmeEndpoint() {
		return `/repos/${this.repoInfo.owner}/${this.repoInfo.repo}/readme`;
	}

	_getUpdateEndpint() {
		return `/repos/${this.repoInfo.owner}/${this.repoInfo.repo}/contents/README.md`;
	}

	async init() {
		try {
			const {
				data: {
					sha,
					content: preContent
				}
			} = await this.octokit.request(`GET ${this._getReadmeEndpoint()}`, {
				headers: {
					authorization: `token ${this.token}`
				},
				ref: this.currentBranch
			});

			const readmeContent = decode(preContent);
			const updatedContent = this._addBadges(readmeContent);
			const encoded64Content = encode(updatedContent);
			const blob = await this.octokit.git.createBlob({
				...this.repoInfo,
				content: encoded64Content,
				encoding: 'base64'
			});

			if (sha !== blob.data.sha) {
				await this.octokit.request(`PUT ${this._getUpdateEndpint()}`, {
					headers: {
						authorization: `token ${this.token}`
					},
					message: 'chore: add badges :unicorn:',
					content: encoded64Content,
					branch: this.currentBranch,
					sha
				});
			}
		} catch (error) {
			core.setFailed(error);
		}
	}
}

const genBadges = new GenerateBadges();
(async () => {
	await genBadges.init();
})();
