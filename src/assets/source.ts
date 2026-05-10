import wzh from './team-avtar/wzh.jpg'
import lyk from './team-avtar/lyk.jpg'
import dzh from './team-avtar/dzh.jpg'
import pzj from './team-avtar/pzj.jpg'
import tjy from './team-avtar/tjy.jpg'
import cg from './team-avtar/cg.jpg'
import wjr from './team-avtar/wjr.jpg'

export const getMemberImg = (name: string) => {
    switch (name) {
        case 'wzh':
            return wzh;
        case 'lyk':
            return lyk;
        case 'dzh':
            return dzh;
        case 'pzj':
            return pzj;
        case 'tjy':
            return tjy;
        case 'cg':
            return cg;
        case 'wjr':
            return wjr;
        default:
            return dzh;
    }
}
