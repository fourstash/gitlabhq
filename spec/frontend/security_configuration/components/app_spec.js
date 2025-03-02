import { GlTab } from '@gitlab/ui';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { useLocalStorageSpy } from 'helpers/local_storage_helper';
import { makeMockUserCalloutDismisser } from 'helpers/mock_user_callout_dismisser';
import stubChildren from 'helpers/stub_children';
import { extendedWrapper } from 'helpers/vue_test_utils_helper';
import SecurityConfigurationApp, { i18n } from '~/security_configuration/components/app.vue';
import AutoDevopsAlert from '~/security_configuration/components/auto_dev_ops_alert.vue';
import AutoDevopsEnabledAlert from '~/security_configuration/components/auto_dev_ops_enabled_alert.vue';
import {
  SAST_NAME,
  SAST_SHORT_NAME,
  SAST_DESCRIPTION,
  SAST_HELP_PATH,
  SAST_CONFIG_HELP_PATH,
  LICENSE_COMPLIANCE_NAME,
  LICENSE_COMPLIANCE_DESCRIPTION,
  LICENSE_COMPLIANCE_HELP_PATH,
  AUTO_DEVOPS_ENABLED_ALERT_DISMISSED_STORAGE_KEY,
} from '~/security_configuration/components/constants';
import FeatureCard from '~/security_configuration/components/feature_card.vue';

import UpgradeBanner from '~/security_configuration/components/upgrade_banner.vue';
import {
  REPORT_TYPE_LICENSE_COMPLIANCE,
  REPORT_TYPE_SAST,
} from '~/vue_shared/security_reports/constants';

const upgradePath = '/upgrade';
const autoDevopsHelpPagePath = '/autoDevopsHelpPagePath';
const autoDevopsPath = '/autoDevopsPath';
const gitlabCiHistoryPath = 'test/historyPath';
const projectPath = 'namespace/project';

useLocalStorageSpy();

describe('App component', () => {
  let wrapper;
  let userCalloutDismissSpy;

  const createComponent = ({
    shouldShowCallout = true,
    secureVulnerabilityTraining = true,
    ...propsData
  }) => {
    userCalloutDismissSpy = jest.fn();

    wrapper = extendedWrapper(
      mount(SecurityConfigurationApp, {
        propsData,
        provide: {
          upgradePath,
          autoDevopsHelpPagePath,
          autoDevopsPath,
          projectPath,
          glFeatures: {
            secureVulnerabilityTraining,
          },
        },
        stubs: {
          ...stubChildren(SecurityConfigurationApp),
          GlLink: false,
          GlSprintf: false,
          LocalStorageSync: false,
          SectionLayout: false,
          UserCalloutDismisser: makeMockUserCalloutDismisser({
            dismiss: userCalloutDismissSpy,
            shouldShowCallout,
          }),
        },
      }),
    );
  };

  const findMainHeading = () => wrapper.find('h1');
  const findTab = () => wrapper.findComponent(GlTab);
  const findTabs = () => wrapper.findAllComponents(GlTab);
  const findByTestId = (id) => wrapper.findByTestId(id);
  const findFeatureCards = () => wrapper.findAllComponents(FeatureCard);
  const findManageViaMRErrorAlert = () => wrapper.findByTestId('manage-via-mr-error-alert');
  const findLink = ({ href, text, container = wrapper }) => {
    const selector = `a[href="${href}"]`;
    const link = container.find(selector);

    if (link.exists() && link.text() === text) {
      return link;
    }

    return wrapper.find(`${selector} does not exist`);
  };
  const findSecurityViewHistoryLink = () =>
    findLink({
      href: gitlabCiHistoryPath,
      text: i18n.configurationHistory,
      container: findByTestId('security-testing-tab'),
    });
  const findComplianceViewHistoryLink = () =>
    findLink({
      href: gitlabCiHistoryPath,
      text: i18n.configurationHistory,
      container: findByTestId('compliance-testing-tab'),
    });
  const findUpgradeBanner = () => wrapper.findComponent(UpgradeBanner);
  const findAutoDevopsAlert = () => wrapper.findComponent(AutoDevopsAlert);
  const findAutoDevopsEnabledAlert = () => wrapper.findComponent(AutoDevopsEnabledAlert);

  const securityFeaturesMock = [
    {
      name: SAST_NAME,
      shortName: SAST_SHORT_NAME,
      description: SAST_DESCRIPTION,
      helpPath: SAST_HELP_PATH,
      configurationHelpPath: SAST_CONFIG_HELP_PATH,
      type: REPORT_TYPE_SAST,
      available: true,
    },
  ];

  const complianceFeaturesMock = [
    {
      name: LICENSE_COMPLIANCE_NAME,
      description: LICENSE_COMPLIANCE_DESCRIPTION,
      helpPath: LICENSE_COMPLIANCE_HELP_PATH,
      type: REPORT_TYPE_LICENSE_COMPLIANCE,
      configurationHelpPath: LICENSE_COMPLIANCE_HELP_PATH,
    },
  ];

  afterEach(() => {
    wrapper.destroy();
  });

  describe('basic structure', () => {
    beforeEach(() => {
      createComponent({
        augmentedSecurityFeatures: securityFeaturesMock,
        augmentedComplianceFeatures: complianceFeaturesMock,
      });
    });

    it('renders main-heading with correct text', () => {
      const mainHeading = findMainHeading();
      expect(mainHeading.exists()).toBe(true);
      expect(mainHeading.text()).toContain('Security Configuration');
    });

    describe('tabs', () => {
      const expectedTabs = ['security-testing', 'compliance-testing', 'vulnerability-management'];

      it('renders GlTab Component', () => {
        expect(findTab().exists()).toBe(true);
      });

      it('renders correct amount of tabs', () => {
        expect(findTabs()).toHaveLength(expectedTabs.length);
      });

      it.each(expectedTabs)('renders the %s tab', (tabName) => {
        expect(findByTestId(`${tabName}-tab`).exists()).toBe(true);
      });
    });

    it('renders right amount of feature cards for given props with correct props', () => {
      const cards = findFeatureCards();
      expect(cards).toHaveLength(2);
      expect(cards.at(0).props()).toEqual({ feature: securityFeaturesMock[0] });
      expect(cards.at(1).props()).toEqual({ feature: complianceFeaturesMock[0] });
    });

    it('renders a basic description', () => {
      expect(wrapper.text()).toContain(i18n.description);
    });

    it('should not show latest pipeline link when latestPipelinePath is not defined', () => {
      expect(findByTestId('latest-pipeline-info').exists()).toBe(false);
    });

    it('should not show configuration History Link when gitlabCiPresent & gitlabCiHistoryPath are not defined', () => {
      expect(findComplianceViewHistoryLink().exists()).toBe(false);
      expect(findSecurityViewHistoryLink().exists()).toBe(false);
    });
  });

  describe('Manage via MR Error Alert', () => {
    beforeEach(() => {
      createComponent({
        augmentedSecurityFeatures: securityFeaturesMock,
        augmentedComplianceFeatures: complianceFeaturesMock,
      });
    });

    describe('on initial load', () => {
      it('should  not show Manage via MR Error Alert', () => {
        expect(findManageViaMRErrorAlert().exists()).toBe(false);
      });
    });

    describe('when error occurs', () => {
      it('should show Alert with error Message', async () => {
        expect(findManageViaMRErrorAlert().exists()).toBe(false);
        findFeatureCards().at(1).vm.$emit('error', 'There was a manage via MR error');

        await nextTick();
        expect(findManageViaMRErrorAlert().exists()).toBe(true);
        expect(findManageViaMRErrorAlert().text()).toEqual('There was a manage via MR error');
      });

      it('should hide Alert when it is dismissed', async () => {
        findFeatureCards().at(1).vm.$emit('error', 'There was a manage via MR error');

        await nextTick();
        expect(findManageViaMRErrorAlert().exists()).toBe(true);

        findManageViaMRErrorAlert().vm.$emit('dismiss');
        await nextTick();
        expect(findManageViaMRErrorAlert().exists()).toBe(false);
      });
    });
  });

  describe('Auto DevOps hint alert', () => {
    describe('given the right props', () => {
      beforeEach(() => {
        createComponent({
          augmentedSecurityFeatures: securityFeaturesMock,
          augmentedComplianceFeatures: complianceFeaturesMock,
          autoDevopsEnabled: false,
          gitlabCiPresent: false,
          canEnableAutoDevops: true,
        });
      });

      it('should show AutoDevopsAlert', () => {
        expect(findAutoDevopsAlert().exists()).toBe(true);
      });

      it('calls the dismiss callback when closing the AutoDevopsAlert', () => {
        expect(userCalloutDismissSpy).not.toHaveBeenCalled();

        findAutoDevopsAlert().vm.$emit('dismiss');

        expect(userCalloutDismissSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('given the wrong props', () => {
      beforeEach(() => {
        createComponent({
          augmentedSecurityFeatures: securityFeaturesMock,
          augmentedComplianceFeatures: complianceFeaturesMock,
        });
      });
      it('should not show AutoDevopsAlert', () => {
        expect(findAutoDevopsAlert().exists()).toBe(false);
      });
    });
  });

  describe('Auto DevOps enabled alert', () => {
    describe.each`
      context                                        | autoDevopsEnabled | localStorageValue | shouldRender
      ${'enabled'}                                   | ${true}           | ${null}           | ${true}
      ${'enabled, alert dismissed on other project'} | ${true}           | ${['foo/bar']}    | ${true}
      ${'enabled, alert dismissed on this project'}  | ${true}           | ${[projectPath]}  | ${false}
      ${'not enabled'}                               | ${false}          | ${null}           | ${false}
    `('given Auto DevOps is $context', ({ autoDevopsEnabled, localStorageValue, shouldRender }) => {
      beforeEach(() => {
        if (localStorageValue !== null) {
          window.localStorage.setItem(
            AUTO_DEVOPS_ENABLED_ALERT_DISMISSED_STORAGE_KEY,
            JSON.stringify(localStorageValue),
          );
        }

        createComponent({
          augmentedSecurityFeatures: securityFeaturesMock,
          augmentedComplianceFeatures: complianceFeaturesMock,
          autoDevopsEnabled,
        });
      });

      it(shouldRender ? 'renders' : 'does not render', () => {
        expect(findAutoDevopsEnabledAlert().exists()).toBe(shouldRender);
      });
    });

    describe('dismissing', () => {
      describe.each`
        dismissedProjects | expectedWrittenValue
        ${null}           | ${[projectPath]}
        ${[]}             | ${[projectPath]}
        ${['foo/bar']}    | ${['foo/bar', projectPath]}
        ${[projectPath]}  | ${[projectPath]}
      `(
        'given dismissed projects $dismissedProjects',
        ({ dismissedProjects, expectedWrittenValue }) => {
          beforeEach(() => {
            if (dismissedProjects !== null) {
              window.localStorage.setItem(
                AUTO_DEVOPS_ENABLED_ALERT_DISMISSED_STORAGE_KEY,
                JSON.stringify(dismissedProjects),
              );
            }

            createComponent({
              augmentedSecurityFeatures: securityFeaturesMock,
              augmentedComplianceFeatures: complianceFeaturesMock,
              autoDevopsEnabled: true,
            });

            findAutoDevopsEnabledAlert().vm.$emit('dismiss');
          });

          it('adds current project to localStorage value', () => {
            expect(window.localStorage.setItem).toHaveBeenLastCalledWith(
              AUTO_DEVOPS_ENABLED_ALERT_DISMISSED_STORAGE_KEY,
              JSON.stringify(expectedWrittenValue),
            );
          });

          it('hides the alert', () => {
            expect(findAutoDevopsEnabledAlert().exists()).toBe(false);
          });
        },
      );
    });
  });

  describe('upgrade banner', () => {
    const makeAvailable = (available) => (feature) => ({ ...feature, available });

    describe('given at least one unavailable feature', () => {
      beforeEach(() => {
        createComponent({
          augmentedSecurityFeatures: securityFeaturesMock,
          augmentedComplianceFeatures: complianceFeaturesMock.map(makeAvailable(false)),
        });
      });

      it('renders the banner', () => {
        expect(findUpgradeBanner().exists()).toBe(true);
      });

      it('calls the dismiss callback when closing the banner', () => {
        expect(userCalloutDismissSpy).not.toHaveBeenCalled();

        findUpgradeBanner().vm.$emit('close');

        expect(userCalloutDismissSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('given at least one unavailable feature, but banner is already dismissed', () => {
      beforeEach(() => {
        createComponent({
          augmentedSecurityFeatures: securityFeaturesMock,
          augmentedComplianceFeatures: complianceFeaturesMock.map(makeAvailable(false)),
          shouldShowCallout: false,
        });
      });

      it('does not render the banner', () => {
        expect(findUpgradeBanner().exists()).toBe(false);
      });
    });

    describe('given all features are available', () => {
      beforeEach(() => {
        createComponent({
          augmentedSecurityFeatures: securityFeaturesMock.map(makeAvailable(true)),
          augmentedComplianceFeatures: complianceFeaturesMock.map(makeAvailable(true)),
        });
      });

      it('does not render the banner', () => {
        expect(findUpgradeBanner().exists()).toBe(false);
      });
    });
  });

  describe('when given latestPipelinePath props', () => {
    beforeEach(() => {
      createComponent({
        augmentedSecurityFeatures: securityFeaturesMock,
        augmentedComplianceFeatures: complianceFeaturesMock,
        latestPipelinePath: 'test/path',
      });
    });

    it('should show latest pipeline info on the security tab  with correct link when latestPipelinePath is defined', () => {
      const latestPipelineInfoSecurity = findByTestId('latest-pipeline-info-security');

      expect(latestPipelineInfoSecurity.text()).toMatchInterpolatedText(
        i18n.latestPipelineDescription,
      );
      expect(latestPipelineInfoSecurity.find('a').attributes('href')).toBe('test/path');
    });

    it('should show latest pipeline info on the compliance tab  with correct link when latestPipelinePath is defined', () => {
      const latestPipelineInfoCompliance = findByTestId('latest-pipeline-info-compliance');

      expect(latestPipelineInfoCompliance.text()).toMatchInterpolatedText(
        i18n.latestPipelineDescription,
      );
      expect(latestPipelineInfoCompliance.find('a').attributes('href')).toBe('test/path');
    });
  });

  describe('given gitlabCiPresent & gitlabCiHistoryPath props', () => {
    beforeEach(() => {
      createComponent({
        augmentedSecurityFeatures: securityFeaturesMock,
        augmentedComplianceFeatures: complianceFeaturesMock,
        gitlabCiPresent: true,
        gitlabCiHistoryPath,
      });
    });

    it('should show configuration History Link', () => {
      expect(findComplianceViewHistoryLink().exists()).toBe(true);
      expect(findSecurityViewHistoryLink().exists()).toBe(true);

      expect(findComplianceViewHistoryLink().attributes('href')).toBe('test/historyPath');
      expect(findSecurityViewHistoryLink().attributes('href')).toBe('test/historyPath');
    });
  });

  describe('when secureVulnerabilityTraining feature flag is disabled', () => {
    beforeEach(() => {
      createComponent({
        augmentedSecurityFeatures: securityFeaturesMock,
        augmentedComplianceFeatures: complianceFeaturesMock,
        secureVulnerabilityTraining: false,
      });
    });

    it('renders correct amount of tabs', () => {
      expect(findTabs()).toHaveLength(2);
    });

    it('does not render the vulnerability-management tab', () => {
      expect(wrapper.findByTestId('vulnerability-management-tab').exists()).toBe(false);
    });
  });
});
