module.exports = {
  extends: ['@commitlint/config-conventional'],
  ignores: [(message) => message.startsWith('#')],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore']],
    'subject-empty': [2, 'never'],
    'type-empty': [2, 'never'],
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
  },
  parserPreset: {
    parserOpts: {
      headerPattern: /^(\w+)(?:\((.*)\))?:(.*)$/,
      headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },
}
