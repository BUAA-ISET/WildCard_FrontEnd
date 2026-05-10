<template>
  <h1>ISET</h1>
  <div class="main-content">
    <p>我们是 ISET 团队</p>
    <p><b>ISET</b> 的本意是 <b>Improvised Software Engineering Team</b></p>
    <p class="highlight">临时软工团队</p>
    <p>
      经过不断磨合，在合作过程中我们精进技术、提升能力，最终将团队打造成了
    </p>
    <p class="highlight">Incredible Software Engineering Team</p>
    <p>团队成员如下：</p>
    <div class="member-list">
      <a
        v-for="member in members"
        :key="member.name"
        class="member"
        :href="member.githubUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img :src="getMemberImg(member.avatar)" :alt="member.name">
        <p>{{ member.name }}</p>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getMemberImg } from '../assets/source'

const members = [
  {
    name: 'ywxy12138',
    avatar: 'wzh',
    githubUrl: 'https://github.com/ywxy12138'
  },
  {
    name: 'Likend',
    avatar: 'lyk',
    githubUrl: 'https://github.com/Likend'
  },
  {
    name: 'cdostan',
    avatar: 'dzh',
    githubUrl: 'https://github.com/cdostan'
  },
  {
    name: 'LajiPZ',
    avatar: 'pzj',
    githubUrl: 'https://github.com/LajiPZ'
  },
  {
    name: 'Tanhhhhtjy',
    avatar: 'tjy',
    githubUrl: 'https://github.com/Tanhhhhtjy'
  },
  {
    name: 'er-huo',
    avatar: 'cg',
    githubUrl: 'https://github.com/er-huo'
  },
  {
    name: 'hillarys14',
    avatar: 'wjr',
    githubUrl: 'https://github.com/hillarys14'
  }
]
</script>

<style scoped>
.main-content {
  font-size: 24px;
}

.main-content p {
  margin: 40px 0;
}

.highlight {
  font-size: 40px;
  font-weight: bold;
}

.member-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 40px;
  width: 500px;
  height: 500px;
  margin: 40px auto;
}

.member-list .member:nth-child(7) {
  grid-column: 2;
  grid-row: 3;
}

.member {
  color: inherit;
  text-align: center;
  text-decoration: none;
  transition: transform 0.3s ease;
}

.member:hover {
  transform: scale(1.1);
  cursor: pointer;
}

.member img {
  border-radius: 50%;
  object-fit: cover;
}
</style>
